// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./interfaces/ICasimirUpkeep.sol";
import "./interfaces/ICasimirManager.sol";
import "./vendor/FunctionsClient.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

/**
 * @title Upkeep contract that automates reporting operations
 */
contract CasimirUpkeep is ICasimirUpkeep, Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, FunctionsClient {
    /*************/
    /* Libraries */
    /*************/

    /** Use Chainlink functions request library */
    using Functions for Functions.Request;

    /*************/
    /* Constants */
    /*************/

    /** Report-to-report heartbeat duration */
    uint256 private constant REPORT_HEARTBEAT = 1 days;


    /*********/
    /* State */
    /*********/

    /** Manager contract */
    ICasimirManager private manager;
    /** Previous report timestamp */
    uint256 private previousReportTimestamp;
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
    /** Current report beacon chain balance */
    uint256 private reportBeaconBalance;
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
    /** Request source */
    string requestSource;
    /** Default request arguments */
    string[] public defaultRequestArgs;
    /** Fulfillment gas limit */
    uint32 public fulfillGasLimit;
    /** Storage gap */
    uint256[50] private __gap;

    // @custom:oz-upgrades-unsafe-allow constructor
    constructor() FunctionsClient(address(0)) {
        _disableInitializers();
    }

    /**
     * Initialize the contract
     * @param functionsOracleAddress The Chainlink functions oracle address
     */
    function initialize(
        address functionsOracleAddress
    ) public initializer {
        require(
            functionsOracleAddress != address(0),
            "Missing functions oracle address"
        );

        __Ownable_init();
        __ReentrancyGuard_init();
        setOracle(functionsOracleAddress);
        manager = ICasimirManager(msg.sender);
    }

    /**
     * @notice Set a new Chainlink functions oracle address
     * @param newFunctionsOracleAddress New Chainlink functions oracle address
     */
    function setFunctionsOracleAddress(address newFunctionsOracleAddress) external onlyOwner {
        require (
            newFunctionsOracleAddress != address(0),
            "Missing functions oracle address"
        );

        setOracle(newFunctionsOracleAddress);

        emit FunctionsOracleAddressSet(newFunctionsOracleAddress);
    }

    /**
     * Set a new Chainlink functions request
     * @param newRequestSource JavaScript source code
     * @param newRequestArgs List of arguments accessible from within the source code
     * @param newFulfillGasLimit The new Chainlink functions fulfill gas limit 
     */
    function setFunctionsRequest(
        string calldata newRequestSource,
        string[] calldata newRequestArgs,
        uint32 newFulfillGasLimit
    ) external onlyOwner {
        requestSource = newRequestSource;
        defaultRequestArgs = newRequestArgs;
        fulfillGasLimit = newFulfillGasLimit;

        emit FunctionsRequestSet(
            newRequestSource, 
            newRequestArgs,
            newFulfillGasLimit
        );
    }

    /**
     * @notice Perform the upkeep
     */
    function performUpkeep(bytes calldata) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        require(upkeepNeeded, "Upkeep not needed");

        if (reportStatus == ReportStatus.FINALIZED) {
            previousReportTimestamp = reportTimestamp;
            reportStatus = ReportStatus.REQUESTING;
            reportRequestBlock = block.number;
            reportTimestamp = block.timestamp;
            reportPeriod = manager.reportPeriod();
            Functions.Request memory request;
            request.initializeRequest(
                Functions.Location.Inline,
                Functions.CodeLanguage.JavaScript,
                requestSource
            );
            string[] memory requestArgs = defaultRequestArgs;
            requestArgs[7] = StringsUpgradeable.toString(previousReportTimestamp);
            requestArgs[8] = StringsUpgradeable.toString(reportTimestamp);
            requestArgs[9] = StringsUpgradeable.toString(reportRequestBlock);
            sendFunctionsRequest(request, requestArgs, RequestType.BALANCES);
            sendFunctionsRequest(request, requestArgs, RequestType.DETAILS);
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
                    beaconBalance: reportBeaconBalance,
                    sweptBalance: reportSweptBalance,
                    activatedDeposits: reportActivatedDeposits,
                    completedExits: reportCompletedExits
                });
                manager.compoundRewards(reportCompoundablePoolIds);
                reportBeaconBalance = 0;
                reportActivatedDeposits = 0;
                reportForcedExits = 0;
                reportCompletedExits = 0;
                reportCompoundablePoolIds = [0, 0, 0, 0, 0];
            }
        }

        emit UpkeepPerformed(reportStatus);
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
        returns (bool upkeepNeeded, bytes memory checkData)
    {
        if (reportStatus == ReportStatus.FINALIZED) {
            bool checkActive = manager.getPendingPoolIds().length + manager.getStakedPoolIds().length > 0;
            bool heartbeatLapsed = (block.timestamp - reportTimestamp) >= REPORT_HEARTBEAT;
            upkeepNeeded = checkActive && heartbeatLapsed;
        } else if (reportStatus == ReportStatus.PROCESSING) {
            bool finalizeReport = reportCompletedExits == manager.finalizableCompletedExits();
            upkeepNeeded = finalizeReport;
        }
        return (upkeepNeeded, checkData);
    }

    /**
     * @notice Callback that is invoked once the DON has resolved the request or hit an error
     * @param requestId The request ID, returned by sendRequest()
     * @param response Aggregated response from the DON
     * @param executionError Aggregated error from the code execution
     * Either response or error parameter will be set, but never both
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory executionError
    ) internal override {
        RequestType requestType = reportRequests[requestId];
        require(requestType != RequestType.NONE, "Invalid request ID");

        reportResponseError = executionError;
        if (executionError.length == 0) {
            delete reportRequests[requestId];
            reportRemainingRequests--;
            if (requestType == RequestType.BALANCES) {
                (
                    uint128 beaconBalance,
                    uint128 sweptBalance
                ) = abi.decode(response, (uint128, uint128));
                reportBeaconBalance = uint256(beaconBalance);
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

        emit OCRResponse(requestId, response, executionError);
    }

    /**
     * @notice Send a Chainlink functions request
     * @param request The Chainlink functions request
     * @param requestArgs The Chainlink functions request arguments
     * @param requestType The Chainlink functions request type
     */
    function sendFunctionsRequest(
        Functions.Request memory request,
        string[] memory requestArgs,
        RequestType requestType
    ) private {
        requestArgs[10] = StringsUpgradeable.toString(uint256(requestType));
        request.addArgs(requestArgs);
        bytes32 requestId = sendRequest(request, manager.functionsId(), fulfillGasLimit);
        reportRequests[requestId] = requestType;
        reportRemainingRequests++;
    }
}
