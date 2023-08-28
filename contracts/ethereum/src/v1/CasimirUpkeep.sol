// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./interfaces/ICasimirUpkeep.sol";
import "./interfaces/ICasimirManager.sol";
import {Functions, FunctionsClient} from "./vendor/FunctionsClient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Upkeep contract that automates and handles reports
 */
contract CasimirUpkeep is ICasimirUpkeep, FunctionsClient, Ownable {
    /*************/
    /* Libraries */
    /*************/

    /** Use Chainlink functions request library */
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
    bytes private requestCBOR;
    /** Fulfillment gas limit */
    uint32 private fulfillGasLimit;

    /***************/
    /* Constructor */
    /***************/

    /**
     * Constructor
     * @param functionsOracleAddress The Chainlink functions oracle address
     */
    constructor(
        address functionsOracleAddress
    ) FunctionsClient(functionsOracleAddress) {
        require(
            functionsOracleAddress != address(0),
            "Missing functions oracle address"
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
     * Set a new Chainlink functions request
     * @param newRequestCBOR The new Chainlink functions request CBOR
     * @param newFulfillGasLimit The new Chainlink functions fulfill gas limit 
     */
    function setRequest(
        bytes calldata  newRequestCBOR,
        uint32 newFulfillGasLimit
    ) external onlyOwner {
        requestCBOR = newRequestCBOR;
        fulfillGasLimit = newFulfillGasLimit;

        emit RequestSet(newRequestCBOR, newFulfillGasLimit);
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
            uint64 functionsId = manager.functionsId();
            reportRemainingRequests = 2;
            for (uint256 i = 0; i < reportRemainingRequests; i++) {
                bytes32 requestId = s_oracle.sendRequest(functionsId, requestCBOR, fulfillGasLimit);
                s_pendingRequests[requestId] = s_oracle.getRegistry();
                reportRequests[requestId] = RequestType(i + 1);
                
                emit RequestSent(requestId);
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
     * @notice Set a new Chainlink functions oracle address
     * @param newOracleAddress New Chainlink functions oracle address
     */
    function setOracleAddress(address newOracleAddress) external onlyOwner {
        require (
            newOracleAddress != address(0),
            "Missing oracle address"
        );

        setOracle(newOracleAddress);

        emit OracleAddressSet(newOracleAddress);
    }
}
