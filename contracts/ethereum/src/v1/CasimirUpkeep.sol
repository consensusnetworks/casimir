// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./interfaces/ICasimirUpkeep.sol";
import "./interfaces/ICasimirManager.sol";
import {Functions, FunctionsClient} from "@chainlink/contracts/src/v0.8/dev/functions/FunctionsClient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import 'hardhat/console.sol';

/**
 * @title Upkeep contract that automates and handles reports
 */
contract CasimirUpkeep is ICasimirUpkeep, FunctionsClient, Ownable {
    /*************/
    /* Libraries */
    /*************/

    /** Use Chainlink Functions */
    using Functions for Functions.Request;

    /*************/
    /* Constants */
    /*************/

    /** Oracle heartbeat */
    uint256 private constant REPORT_HEARTBEAT = 1 days;

    /*************/
    /* Immutable */
    /*************/

    /** Manager contract */
    ICasimirManager private immutable manager;

    /*********/
    /* State */
    /*********/

    /** Current report status */
    ReportStatus private reportStatus;
    /** Current report period */
    uint32 private reportPeriod;
    /** Current report remaining request count */
    uint256 private reportRemainingRequests;
    /** Current report block */
    uint256 private reportRequestBlock;
    /** Current report request timestamp */
    uint256 private reportTimestamp;
    /** Current report swept balance */
    uint256 private reportSweptBalance;
    /** Current report active balance */
    uint256 private reportActiveBalance;
    /** Current report deposit activations */
    uint256 private reportActivatedDeposits;
    /** Current report unexpected exits */
    uint256 private reportForcedExits;
    /** Current report completed exits */
    uint256 private reportCompletedExits;
    /** Current report compoundable pools */
    uint32[5] private reportCompoundablePoolIds;
    /** Finalizable activated deposits */
    uint256 private finalizableActivatedDeposits;
    /** Finalizable compoundable pools */
    uint32[5] private finalizableCompoundablePoolIds;
    /** Current report request */
    mapping(bytes32 => RequestType) private reportRequests;
    /** Current report response error */
    bytes private reportResponseError;
    /** Binary request source code */
    bytes public requestCBOR;
    /** Fulfillment gas limit */
    uint32 private fulfillGasLimit;
    /** Functions subscription ID (Mocked until managed subscriptions are implemented) */
    uint64 private linkSubscriptionId = 1;

    /***************/
    /* Constructor */
    /***************/

    /**
     * Constructor
     * @param functionsAddress The functions oracle address
     */
    constructor(
        address functionsAddress
    ) FunctionsClient(functionsAddress) {
        require(
            functionsAddress != address(0),
            "Missing functions address"
        );

        manager = ICasimirManager(msg.sender);
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
    ) external pure returns (bytes memory) {
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
     * @param _linkSubscriptionId The functions billing subscription ID used to pay for Functions requests
     * @param _requestCBOR Bytes representing the CBOR-encoded Functions.Request
     */
    function setRequest(
        uint32 _fulfillGasLimit,
        uint64 _linkSubscriptionId,
        bytes calldata _requestCBOR
    ) external onlyOwner {
        fulfillGasLimit = _fulfillGasLimit;
        linkSubscriptionId = _linkSubscriptionId;
        requestCBOR = _requestCBOR;

        emit RequestSet();
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
        if (reportStatus == ReportStatus.FINALIZED) {
            bool checkActive = manager.getPendingPoolIds().length + manager.getStakedPoolIds().length > 0;
            bool heartbeatLapsed = (block.timestamp - reportTimestamp) >= REPORT_HEARTBEAT;
            upkeepNeeded = checkActive && heartbeatLapsed;
        } else if (reportStatus == ReportStatus.PROCESSING) {
            bool finalizeReport = reportCompletedExits == manager.finalizableCompletedExits();
            upkeepNeeded = finalizeReport;
        }
    }

    /**
     * @notice Perform the upkeep
     */
    function performUpkeep(bytes calldata) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        require(upkeepNeeded, "Upkeep not needed");

        if (reportStatus == ReportStatus.FINALIZED) {
            reportStatus = ReportStatus.REQUESTING;
            reportRequestBlock = block.number;
            reportTimestamp = block.timestamp;
            reportPeriod = manager.reportPeriod();
            Functions.Request memory req;
            reportRemainingRequests = 2;
            for (uint256 i = 0; i < reportRemainingRequests; i++) {
                bytes32 requestId = sendRequest(req, linkSubscriptionId, fulfillGasLimit);
                reportRequests[requestId] = RequestType(i + 1);
            }
        } else {
            if (
                manager.requestedWithdrawalBalance() > 0 &&
                manager.getPendingWithdrawalEligibility(0, reportPeriod) &&
                manager.requestedWithdrawalBalance() <= manager.getWithdrawableBalance()
            ) {
                manager.fulfillWithdrawals(5);
            }
            if (finalizableActivatedDeposits > 0) {
                uint256 maxActivatedDeposits = finalizableActivatedDeposits > 5 ? 5 : finalizableActivatedDeposits;
                finalizableActivatedDeposits -= maxActivatedDeposits;
                manager.activateDeposits(maxActivatedDeposits);
            }
            if (!manager.getPendingWithdrawalEligibility(0, reportPeriod) && finalizableActivatedDeposits == 0) {
                reportStatus = ReportStatus.FINALIZED;
                manager.rebalanceStake({
                    activeBalance: reportActiveBalance,
                    sweptBalance: reportSweptBalance,
                    activatedDeposits: reportActivatedDeposits,
                    completedExits: reportCompletedExits
                });
                manager.compoundRewards(reportCompoundablePoolIds);
                reportActiveBalance = 0;
                reportActivatedDeposits = 0;
                reportForcedExits = 0;
                reportCompletedExits = 0;
                reportCompoundablePoolIds = [0, 0, 0, 0, 0];
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
        RequestType requestType = reportRequests[requestId];
        require(requestType != RequestType.NONE, "Invalid request ID");

        reportResponseError = _error;
        if (_error.length == 0) {
            delete reportRequests[requestId];
            reportRemainingRequests--;
            if (requestType == RequestType.BALANCES) {
                (
                    uint128 activeBalance,
                    uint128 sweptBalance
                ) = abi.decode(response, (uint128, uint128));
                reportActiveBalance = uint256(activeBalance);
                reportSweptBalance = uint256(sweptBalance);
            } else {
                (
                    uint32 activatedDeposits,
                    uint32 forcedExits,
                    uint32 completedExits,
                    uint32[5] memory compoundablePoolIds 
                ) = abi.decode(response, (uint32, uint32, uint32, uint32[5]));
                reportActivatedDeposits = activatedDeposits;
                reportForcedExits = forcedExits;
                reportCompletedExits = completedExits;
                reportCompoundablePoolIds = compoundablePoolIds;
                finalizableActivatedDeposits = activatedDeposits;
                finalizableCompoundablePoolIds = compoundablePoolIds;
            }
            if (reportRemainingRequests == 0) {
                reportStatus = ReportStatus.PROCESSING;
                if (reportForcedExits > 0) {
                    manager.requestForcedExitReports(reportForcedExits);
                }
                if (reportCompletedExits > 0) {
                    manager.requestCompletedExitReports(reportCompletedExits);
                }
            }
        }

        emit OCRResponse(requestId, response, _error);
    }

    /**
     * @notice Set a new functions oracle address
     * @param newFunctionsAddress New functions oracle address
     */
    function setFunctionsAddress(address newFunctionsAddress) external onlyOwner {
        require (
            newFunctionsAddress != address(0),
            "Missing functions address"
        );

        setOracle(newFunctionsAddress);

        emit FunctionsAddressSet(newFunctionsAddress);
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
