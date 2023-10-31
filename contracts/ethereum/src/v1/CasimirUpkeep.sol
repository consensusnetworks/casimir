// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./interfaces/ICasimirFactory.sol";
import "./interfaces/ICasimirManager.sol";
import "./interfaces/ICasimirUpkeep.sol";
import "./vendor/FunctionsClient.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

/// @title Upkeep contract that automates reporting operations
contract CasimirUpkeep is
    ICasimirUpkeep,
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    FunctionsClient
{
    using Functions for Functions.Request;

    /// @inheritdoc ICasimirUpkeep
    bool public compoundStake;
    /// @dev Report-to-report heartbeat duration
    uint256 private constant REPORT_HEARTBEAT = 1 days;
    /// @dev Factory contract
    ICasimirFactory private factory;
    /// @dev Manager contract
    ICasimirManager private manager;
    /// @dev Previous report timestamp
    uint256 private previousReportTimestamp;
    /// @dev Current report status
    ReportStatus private reportStatus;
    /// @dev Current report period
    uint32 private reportPeriod;
    /// @dev Current report remaining request count
    uint256 private reportRemainingRequests;
    /// @dev Current report block
    uint256 private reportRequestBlock;
    /// @dev Current report request timestamp
    uint256 private reportTimestamp;
    /// @dev Current report swept balance
    uint256 private reportSweptBalance;
    /// @dev Current report beacon chain balance
    uint256 private reportBeaconBalance;
    /// @dev Current report deposit activations
    uint256 private reportActivatedDeposits;
    /// @dev Current report unexpected exits
    uint256 private reportForcedExits;
    /// @dev Current report completed exits
    uint256 private reportCompletedExits;
    /// @dev Current report compoundable pools
    uint32[5] private reportCompoundablePoolIds;
    /// @dev Finalizable compoundable pools (not used, will be removed in future version)
    uint32[5] private finalizableCompoundablePoolIds;
    /// @dev Current report request
    mapping(bytes32 => RequestType) private reportRequests;
    /// @dev Current report response error
    bytes private reportResponseError;
    /// @dev Request source
    string private requestSource;
    /// @dev Default request arguments
    string[] private defaultRequestArgs;
    /// @dev Fulfillment gas limit
    uint32 private fulfillGasLimit;
    /// @dev Whether a report has been requested
    bool private reportRequested;
    /// @dev Previous report block
    uint256 private previousReportBlock;
    /// @dev DON transmitter address (not used, will be removed in future version)
    address private transmitterAddress;
    /// @dev Storage gap
    uint256[48] private __gap;

    /**
     * @dev Constructor
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor() FunctionsClient(address(0)) {
        _disableInitializers();
    }

    /**
     * Initialize the contract
     * @param factoryAddress Factory address
     * @param functionsOracleAddress Chainlink functions oracle address
     * @param compoundStake_ Whether compound stake is enabled
     */
    function initialize(
        address factoryAddress,
        address functionsOracleAddress,
        bool compoundStake_
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        factory = ICasimirFactory(factoryAddress);
        manager = ICasimirManager(msg.sender);
        compoundStake = compoundStake_;
        setOracle(functionsOracleAddress);
    }

    /// @inheritdoc ICasimirUpkeep
    function performUpkeep(bytes calldata) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert UpkeepNotNeeded();
        }
        if (reportStatus == ReportStatus.FINALIZED) {
            reportStatus = ReportStatus.REQUESTING;
            previousReportBlock = reportRequestBlock;
            previousReportTimestamp = reportTimestamp;
            reportRequestBlock = block.number;
            reportTimestamp = block.timestamp;
            reportPeriod = manager.reportPeriod();
            Functions.Request memory request;
            request.initializeRequest(Functions.Location.Inline, Functions.CodeLanguage.JavaScript, requestSource);
            string[] memory requestArgs = defaultRequestArgs;
            requestArgs[7] = StringsUpgradeable.toString(previousReportTimestamp);
            requestArgs[8] = StringsUpgradeable.toString(reportTimestamp);
            requestArgs[9] = StringsUpgradeable.toString(reportRequestBlock);
            sendFunctionsRequest(request, requestArgs, RequestType.BALANCES);
            sendFunctionsRequest(request, requestArgs, RequestType.DETAILS);
            emit ReportRequestsSent(
                reportPeriod,
                reportRequestBlock,
                reportTimestamp,
                previousReportBlock,
                previousReportTimestamp
            );
        } else {
            if (
                manager.requestedWithdrawalBalance() > 0 &&
                manager.getPendingWithdrawalEligibility(0, reportPeriod) &&
                manager.requestedWithdrawalBalance() <= manager.getWithdrawableBalance()
            ) {
                manager.fulfillWithdrawals(5);
            }
            if (!manager.getPendingWithdrawalEligibility(0, reportPeriod)) {
                if (reportRequested) {
                    reportRequested = false;
                }
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

    /// @inheritdoc ICasimirUpkeep
    function requestReport() external {
        onlyFactoryOwner();
        reportRequested = true;
        emit ReportRequested();
    }

    /// @inheritdoc ICasimirUpkeep
    function resetReport(
        uint32 resetReportPeriod,
        uint256 resetReportBlock,
        uint256 resetReportTimestamp,
        uint256 resetPreviousReportBlock,
        uint256 resetPreviousReportTimestamp
    ) external {
        onlyFactoryOwner();
        reportStatus = ReportStatus.FINALIZED;
        reportRequested = false;
        reportPeriod = resetReportPeriod;
        reportRequestBlock = resetReportBlock;
        reportTimestamp = resetReportTimestamp;
        previousReportBlock = resetPreviousReportBlock;
        previousReportTimestamp = resetPreviousReportTimestamp;
        reportRemainingRequests = 0;
        reportBeaconBalance = 0;
        reportSweptBalance = 0;
        reportActivatedDeposits = 0;
        reportForcedExits = 0;
        reportCompletedExits = 0;
        reportCompoundablePoolIds = [0, 0, 0, 0, 0];
    }

    /// @inheritdoc ICasimirUpkeep
    function setFunctionsOracle(address newFunctionsOracleAddress) external {
        onlyFactoryOwner();
        setOracle(newFunctionsOracleAddress);
        emit FunctionsOracleAddressSet(newFunctionsOracleAddress);
    }

    /// @inheritdoc ICasimirUpkeep
    function setFunctionsRequest(
        string calldata newRequestSource,
        string[] calldata newRequestArgs,
        uint32 newFulfillGasLimit
    ) external {
        onlyFactoryOwner();
        requestSource = newRequestSource;
        defaultRequestArgs = newRequestArgs;
        fulfillGasLimit = newFulfillGasLimit;
        emit FunctionsRequestSet(newRequestSource, newRequestArgs, newFulfillGasLimit);
    }

    /// @inheritdoc ICasimirUpkeep
    function checkUpkeep(bytes memory) public view override returns (bool upkeepNeeded, bytes memory checkData) {
        if (reportStatus == ReportStatus.FINALIZED) {
            bool checkActive = manager.getPendingPoolIds().length + manager.getStakedPoolIds().length > 0;
            bool heartbeatLapsed = (block.timestamp - reportTimestamp) >= REPORT_HEARTBEAT;
            upkeepNeeded = (checkActive && heartbeatLapsed) || (checkActive && reportRequested);
        } else if (reportStatus == ReportStatus.PROCESSING) {
            bool finalizeReport = reportActivatedDeposits == manager.finalizableActivations() &&
                reportCompletedExits == manager.finalizableCompletedExits();
            upkeepNeeded = finalizeReport;
        }
        return (upkeepNeeded, checkData);
    }

    /**
     * @dev Callback that is invoked once the DON has resolved the request or hit an error
     * @param requestId Request ID, returned by sendRequest()
     * @param response Aggregated response from the DON
     * @param err Aggregated error from the code execution
     */
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        RequestType requestType = reportRequests[requestId];
        if (requestType == RequestType.NONE) {
            revert InvalidRequest();
        }
        reportResponseError = err;
        if (err.length == 0) {
            handleResponse(requestId, requestType, response);
        }
        emit OCRResponse(requestId, response, err);
    }

    /**
     * @dev Handle a fulfilled request
     * @param requestId Request ID
     * @param requestType Request type
     * @param response Response
     */
    function handleResponse(bytes32 requestId, RequestType requestType, bytes memory response) private {
        delete reportRequests[requestId];
        reportRemainingRequests--;
        if (requestType == RequestType.BALANCES) {
            (uint128 beaconBalance, uint128 sweptBalance) = abi.decode(response, (uint128, uint128));
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
            if (reportActivatedDeposits > 0) {
                emit ActivationsRequested(activatedDeposits);
            }
            if (reportForcedExits > 0) {
                emit ForcedExitReportsRequested(forcedExits);
            }
            if (reportCompletedExits > 0) {
                emit CompletedExitReportsRequested(completedExits);
            }
        }
        if (reportRemainingRequests == 0) {
            reportStatus = ReportStatus.PROCESSING;
        }
    }

    /**
     * @dev Send a Chainlink functions request
     * @param request Chainlink functions request
     * @param requestArgs Chainlink functions request arguments
     * @param requestType Chainlink functions request type
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

    /// @dev Validate the caller is the factory owner
    function onlyFactoryOwner() private view {
        if (msg.sender != factory.getOwner()) {
            revert Unauthorized();
        }
    }
}
