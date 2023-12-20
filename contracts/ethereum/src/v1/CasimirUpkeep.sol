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
    /// @dev Previous report timestamp (remove in the next deployment)
    uint256 private previousReportTimestamp;
    /// @inheritdoc ICasimirUpkeep
    ReportStatus public reportStatus; // (move up to the public section in the next deployment)
    /// @dev Period for the current report
    uint32 private reportPeriod;
    /// @dev Remaining request count for the current report
    uint256 private reportRemainingRequests;
    /// @dev Request block for the current report (remove in the next deployment)
    uint256 private reportRequestBlock;
    /// @dev Request timestamp for the current report
    uint256 private reportTimestamp;
    /// @dev Swept balance for the current report (swap order -1 in the next deployment)
    uint256 private reportSweptBalance;
    /// @dev Beacon chain balance for the current report (swap order +1 in the next deployment)
    uint256 private reportBeaconBalance;
    /**
     * @dev Requested validator activations for the current report (remove in the next deployment)
     * @custom:oz-renamed-from reportActivatedDeposits
     */
    uint256 private reportActivatedValidators;
    /**
     * @dev Requested validator slashings for the current report (remove in the next deployment)
     * @custom:oz-renamed-from flagValidators
     */
    uint256 private reportSlashedValidators;
    /**
     * @dev Requested validator deactivations for the current report
     * @custom:oz-renamed-from withdrawValidators
     */
    uint256 private reportWithdrawnValidators;
    /// @dev Compoundable pool IDs for the current report
    uint32[5] private reportCompoundablePoolIds;
    /// @dev Finalizable compoundable pools (remove in the next deployment)
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
    /// @dev Whether a report has been requested (remove in the next deployment)
    bool private reportRequested;
    /// @dev Previous report block (remove in the next deployment)
    uint256 private previousReportBlock;
    /// @dev DON transmitter address (remove in the next deployment)
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
            reportTimestamp = block.timestamp;
            reportPeriod = manager.reportPeriod();
            Functions.Request memory request;
            request.initializeRequest(Functions.Location.Inline, Functions.CodeLanguage.JavaScript, requestSource);
            string[] memory requestArgs = defaultRequestArgs;
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
            if (!manager.getPendingWithdrawalEligibility(0, reportPeriod)) {
                reportStatus = ReportStatus.FINALIZED;
                manager.rebalanceStake({
                    beaconBalance: reportBeaconBalance,
                    sweptBalance: reportSweptBalance,
                    withdrawnValidators: reportWithdrawnValidators
                });
                manager.compoundRewards(reportCompoundablePoolIds);
                reportBeaconBalance = 0;
                reportSweptBalance = 0;
                reportCompoundablePoolIds = [0, 0, 0, 0, 0];
                reportWithdrawnValidators = 0;
            }
        }
        emit UpkeepPerformed(reportStatus);
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
            bool checkValidators = manager.getStakedPoolIds().length > 0;
            bool heartbeatLapsed = (block.timestamp - reportTimestamp) >= REPORT_HEARTBEAT;
            upkeepNeeded = checkValidators && heartbeatLapsed;
        } else if (reportStatus == ReportStatus.PROCESSING) {
            bool finalizeReport = reportWithdrawnValidators == manager.finalizableWithdrawnValidators();
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
                uint32[5] memory compoundablePoolIds,
                uint32 withdrawnValidators
            ) = abi.decode(response, (uint32[5], uint32));
            reportCompoundablePoolIds = compoundablePoolIds;
            if (withdrawnValidators > 0) {
                reportWithdrawnValidators = withdrawnValidators;
                emit ValidatorWithdrawalsRequested(withdrawnValidators);
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
        requestArgs[6] = StringsUpgradeable.toString(uint256(requestType));
        request.addArgs(requestArgs);
        bytes32 requestId = sendRequest(request, manager.functionsId(), fulfillGasLimit);
        reportRequests[requestId] = requestType;
        reportRemainingRequests++;
        emit ReportRequestSent(requestId, requestArgs);
    }

    /// @dev Validate the caller is the factory owner
    function onlyFactoryOwner() private view {
        if (msg.sender != factory.getOwner()) {
            revert Unauthorized();
        }
    }
}
