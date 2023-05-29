// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./interfaces/ICasimirUpkeep.sol";
import "./interfaces/ICasimirManager.sol";
import {Functions, FunctionsClient} from "@chainlink/contracts/src/v0.8/dev/functions/FunctionsClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Dev-only imports
import "hardhat/console.sol";

/**
 * @title Oracle contract that triggers and handles actions
 */
contract CasimirUpkeep is ICasimirUpkeep, FunctionsClient, Ownable {
    /*************/
    /* Libraries */
    /*************/

    using Functions for Functions.Request;

    /*************/
    /* Constants */
    /*************/

    /** Oracle heartbeat */
    uint256 public constant reportHeartbeat = 1 days;
    /** Pool capacity */
    uint256 public constant poolCapacity = 32 ether;

    /*************/
    /* Immutable */
    /*************/

    /** Manager contract */
    ICasimirManager private immutable manager;

    /********************/
    /* Dynamic State */
    /********************/

    /** Current report status */
    Status private reportStatus;
    /** Current report period */
    uint256 reportPeriod;
    /** Current report pending pool count */
    uint256 reportPendingPoolCount;
    /** Current report exiting pool count */
    uint256 reportExitingPoolCount;
    /** Current report block */
    uint256 reportRequestBlock;
    /** Current report request timestamp */
    uint256 private reportTimestamp;
    /** Current report swept balance */
    uint256 private reportSweptBalance;
    /** Current report active balance */
    uint256 private reportActiveBalance;
    /** Current report completed deposits */
    uint256 private reportDeposits;
    /** Current report completed exits */
    uint256 private reportExits;
    /** Current report completed slashes */
    uint256 private reportSlashes;
    /** Finalizable completed deposits */
    uint256 private finalizableDeposits;
    /** Current report requests */
    mapping(bytes32 => RequestType) private reportRequests;
    /** Current report remaining requests */
    uint256 reportRemainingRequests;
    /** Latest error */
    bytes private latestError;
    /** Binary request source code */
    bytes public requestCBOR;
    /** Fulfillment gas limit */
    uint32 fulfillGasLimit;
    /** Functions subscription ID */
    uint64 private functionsSubscriptionId;

    /***************/
    /* Constructor */
    /***************/

    /**
     * Constructor
     * @param managerAddress The manager contract address
     * @param functionsOracleAddress The functions oracle contract address
     * @param _functionsSubscriptionId The functions subscription ID
     */
    constructor(
        address managerAddress,
        address functionsOracleAddress,
        uint64 _functionsSubscriptionId
    ) FunctionsClient(functionsOracleAddress) {
        manager = ICasimirManager(managerAddress);
        functionsSubscriptionId = _functionsSubscriptionId;
    }

    /**
     * @notice Generate a new Functions.Request(off-chain, saving gas)
     * @param source JavaScript source code
     * @param secrets Encrypted secrets payload
     * @param args List of arguments accessible from within the source code
     */
    function generateRequest(
        string calldata source,
        bytes calldata secrets,
        string[] calldata args
    ) public pure returns (bytes memory) {
        Functions.Request memory req;
        req.initializeRequest(
            Functions.Location.Inline,
            Functions.CodeLanguage.JavaScript,
            source
        );
        if (secrets.length > 0) {
            req.addRemoteSecrets(secrets);
        }
        if (args.length > 0) {
            req.addArgs(args);
        }
        return req.encodeCBOR();
    }

    /**
     * @notice Set the bytes representing the CBOR-encoded Functions.Request
     * @param _fulfillGasLimit Maximum amount of gas used to call the client contract's `handleOracleFulfillment` function
     * @param _functionsSubscriptionId The functions billing subscription ID used to pay for Functions requests
     * @param _requestCBOR Bytes representing the CBOR-encoded Functions.Request
     */
    function setRequest(
        uint32 _fulfillGasLimit,
        uint64 _functionsSubscriptionId,
        bytes calldata _requestCBOR
    ) external onlyOwner {
        fulfillGasLimit = _fulfillGasLimit;
        functionsSubscriptionId = _functionsSubscriptionId;
        requestCBOR = _requestCBOR;
    }

    /**
     * @notice Check if the upkeep is needed
     * @return upkeepNeeded True if the upkeep is needed
     */
    function checkUpkeep(
        bytes memory
    )
        public
        view
        override
        returns (bool upkeepNeeded, bytes memory)
    {
        if (reportStatus == Status.FINALIZED) {
            bool checkActive = manager.getDepositedPoolCount() > 0;
            bool heartbeatLapsed = (block.timestamp - reportTimestamp) >= reportHeartbeat;
            upkeepNeeded = checkActive && heartbeatLapsed;
        } else if (reportStatus == Status.PROCESSING) {
            bool exitsFinalizable = reportExits == manager.getFinalizableExitedPoolCount();
            upkeepNeeded = exitsFinalizable;
        }
    }

    /**
     * @notice Perform the upkeep
     */
    function performUpkeep(bytes calldata) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        require(upkeepNeeded, "Upkeep not needed");

        if (reportStatus == Status.FINALIZED) {
            reportStatus = Status.REQUESTING;

            reportTimestamp = block.timestamp;
            reportPeriod = manager.getReportPeriod();
            reportPendingPoolCount = manager.getPendingPoolIds().length;
            reportExitingPoolCount = manager.getExitingPoolCount();
            reportSweptBalance = manager.getSweptBalance();

            Functions.Request memory req;
            for (uint256 i = 1; i < 5; i++) {
                RequestType requestType = RequestType(i);
                bool checkBalance = requestType == RequestType.BALANCE;
                bool checkDeposits = requestType == RequestType.DEPOSITS && reportPendingPoolCount > 0;
                bool checkExits = requestType == RequestType.EXITS && reportExitingPoolCount > 0;
                bool checkSlashes = requestType == RequestType.SLASHES;
                if (checkBalance || checkDeposits || checkExits || checkSlashes) {
                    bytes32 requestId = sendRequest(req, functionsSubscriptionId, fulfillGasLimit);
                    reportRequests[requestId] = RequestType(i);
                    reportRemainingRequests++;
                }
            }
        } else {
            if (
                manager.getPendingWithdrawals() > 0 &&
                manager.getPendingWithdrawalEligibility(0, reportPeriod) &&
                manager.getPendingWithdrawals() <= manager.getWithdrawableBalance()
            ) {
                manager.completePendingWithdrawals(5);
            }

            if (finalizableDeposits > 0) {
                uint256 maxCompletions = finalizableDeposits > 5 ? 5 : finalizableDeposits;
                finalizableDeposits -= maxCompletions;
                manager.completePoolDeposits(maxCompletions);
            }
            
            if (!manager.getPendingWithdrawalEligibility(0, reportPeriod) && finalizableDeposits == 0) {
                reportStatus = Status.FINALIZED;
                
                manager.rebalanceStake({
                    activeBalance: reportActiveBalance,
                    newSweptRewards: reportSweptBalance - manager.getFinalizableExitedBalance(),
                    newDeposits: reportDeposits,
                    newExits: reportExits
                });

                reportActiveBalance = 0;
                reportDeposits = 0;
                reportExits = 0;
                reportSlashes = 0;
            }
        }

        emit UpkeepPerformed(reportStatus);
    }

    /**
     * @notice Callback that is invoked once the DON has resolved the request or hit an error
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
     * @param _error Aggregated error from the user code or from the sweptStake pipeline
     * Either response or error parameter will be set, but never both
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory _error
    ) internal override {
        // Todo handle errors
        latestError = _error;

        if (_error.length == 0) {
            uint256 value = abi.decode(response, (uint256));
            RequestType requestType = reportRequests[requestId];

            if (requestType != RequestType.NONE) {
                delete reportRequests[requestId];
                reportRemainingRequests--;

                if (requestType == RequestType.BALANCE) {
                    reportActiveBalance = value;
                } else if (requestType == RequestType.DEPOSITS) {
                    reportDeposits = value;
                    finalizableDeposits = value;
                } else if (requestType == RequestType.EXITS) {
                    reportExits = value;
                    manager.requestPoolExitCompletions(value);
                } else {
                    reportSlashes = value;
                    manager.requestPoolSlashReports(value);
                }

                if (reportRemainingRequests == 0) {
                    reportStatus = Status.PROCESSING;
                }
            }
        }

        emit OCRResponse(requestId, response, _error);
    }

    /**
     * @notice Update the functions oracle address
     * @param newOracleAddress New oracle address
     */
    function setOracleAddress(address newOracleAddress) external onlyOwner {
        setOracle(newOracleAddress);
    }

    // Dev-only functions

    /**
     * @notice Fulfill the request for testing
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the user code
     * @param err Aggregated error from the user code or from the sweptStake pipeline
     * Either response or error parameter will be set, but never both
     */
    function mockFulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) external {
        fulfillRequest(requestId, response, err);
    }
}
