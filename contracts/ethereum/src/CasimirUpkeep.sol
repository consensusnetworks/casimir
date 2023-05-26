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
    Status private status;
    /** Current report remaining requests */
    uint256 remainingRequests;
    /** Current report period */
    uint256 currentPeriod;
    /** Current report pending pool count */
    uint256 currentPendingPoolCount;
    /** Current report exiting pool count */
    uint256 currentExitingPoolCount;
    /** Current report block */
    uint256 currentRequestBlock;
    /** Current report swept balance */
    uint256 private currentSweptBalance;
    /** Current report active balance */
    uint256 private reportedActiveBalance;
    /** Current report completed deposits */
    uint256 private reportedDeposits;
    /** Current report completed exits */
    uint256 private reportedExits;
    /** Current report completed slashes */
    uint256 private reportedSlashes;
    /** Finalizable completed deposits */
    uint256 private finalizableDeposits;
    /** Current report requests */
    mapping(bytes32 => RequestType) private requests;
    /** Latest report request timestamp */
    uint256 private latestReportTimestamp;
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
        if (status == Status.FINALIZED) {
            bool checkActive = manager.getDepositedPoolCount() > 0;
            bool heartbeatLapsed = (block.timestamp - latestReportTimestamp) >= reportHeartbeat;
            upkeepNeeded = checkActive && heartbeatLapsed;
        } else if (status == Status.PROCESSING) {
            bool exitsFinalizable = reportedExits == manager.getFinalizableExitedPoolCount();
            upkeepNeeded = exitsFinalizable;
        }
    }

    /**
     * @notice Perform the upkeep
     */
    function performUpkeep(bytes calldata) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        require(upkeepNeeded, "Upkeep not needed");

        if (status == Status.FINALIZED) {
            status = Status.REQUESTING;

            latestReportTimestamp = block.timestamp;
            currentPeriod = manager.getReportPeriod();
            currentPendingPoolCount = manager.getPendingPoolIds().length;
            currentExitingPoolCount = manager.getExitingPoolCount();
            currentSweptBalance = manager.getSweptBalance();

            Functions.Request memory req;
            for (uint256 i = 1; i < 5; i++) {
                RequestType requestType = RequestType(i);
                bool checkBalance = requestType == RequestType.BALANCE;
                bool checkDeposits = requestType == RequestType.DEPOSITS && currentPendingPoolCount > 0;
                bool checkExits = requestType == RequestType.EXITS && currentExitingPoolCount > 0;
                bool checkSlashes = requestType == RequestType.SLASHES;
                if (checkBalance || checkDeposits || checkExits || checkSlashes) {
                    bytes32 requestId = sendRequest(req, functionsSubscriptionId, fulfillGasLimit);
                    requests[requestId] = RequestType(i);
                    remainingRequests++;
                }
            }
        } else {
            if (
                manager.getPendingWithdrawals() > 0 &&
                manager.getPendingWithdrawalEligibility(0, currentPeriod) &&
                manager.getPendingWithdrawals() <= manager.getWithdrawableBalance()
            ) {
                manager.completePendingWithdrawals(5);
            }
            
            if (finalizableDeposits > 0) {
                uint256 maxCompletions = finalizableDeposits > 5 ? 5 : finalizableDeposits;
                finalizableDeposits -= maxCompletions;
                manager.completePoolDeposits(maxCompletions);
            }
            
            if (!manager.getPendingWithdrawalEligibility(0, currentPeriod) && finalizableDeposits == 0) {
                status = Status.FINALIZED;
                
                manager.rebalanceStake({
                    activeBalance: reportedActiveBalance,
                    newSweptRewards: currentSweptBalance - manager.getFinalizableExitedBalance(),
                    newDeposits: reportedDeposits,
                    newExits: reportedExits
                });

                reportedActiveBalance = 0;
                reportedDeposits = 0;
                reportedExits = 0;
                reportedSlashes = 0;
            }
        }

        emit UpkeepPerformed(status);
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
            RequestType requestType = requests[requestId];

            if (requestType != RequestType.NONE) {
                delete requests[requestId];
                remainingRequests--;

                if (requestType == RequestType.BALANCE) {
                    reportedActiveBalance = value;
                } else if (requestType == RequestType.DEPOSITS) {
                    reportedDeposits = value;
                    finalizableDeposits = value;
                } else if (requestType == RequestType.EXITS) {
                    reportedExits = value;
                } else {
                    reportedSlashes = value;
                }

                if (remainingRequests == 0) {
                    status = Status.PROCESSING;
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
