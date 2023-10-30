// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "../../interfaces/ICasimirCore.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

interface ICasimirUpkeepDev is ICasimirCore, AutomationCompatibleInterface {
    /// @dev Functions request type
    enum RequestType {
        NONE,
        BALANCES,
        DETAILS
    }

    /// @dev Report status
    enum ReportStatus {
        FINALIZED,
        REQUESTING,
        PROCESSING
    }

    event ActivationsRequested(uint256 count);
    event CompletedExitReportsRequested(uint256 count);
    event ForcedExitReportsRequested(uint256 count);
    event FunctionsOracleAddressSet(address newFunctionsOracleAddress);
    event FunctionsRequestSet(string newRequestSource, string[] newRequestArgs, uint32 newFulfillGasLimit);
    event OCRResponse(bytes32 indexed requestId, bytes result, bytes err);
    event ReportRequested();
    event ReportRequestsSent(uint32, uint256, uint256, uint256, uint256);
    event UpkeepPerformed(ReportStatus indexed status);

    error InvalidRequest();
    error UpkeepNotNeeded();

    /// @notice Perform the upkeep
    function performUpkeep(bytes calldata) external;

    /// @notice Request an early report
    function requestReport() external;

    /**
     * @notice Reset the report
     * @param resetReportPeriod Reset report period
     * @param resetReportBlock Reset report block 
     * @param resetReportTimestamp Reset report timestamp
     * @param resetPreviousReportBlock Reset previous report block
     * @param resetPreviousReportTimestamp Reset previous report timestamp
     */
    function resetReport(
        uint32 resetReportPeriod,
        uint256 resetReportBlock,
        uint256 resetReportTimestamp,
        uint256 resetPreviousReportBlock,
        uint256 resetPreviousReportTimestamp
    ) external;

    /**
     * @notice Set a new Chainlink functions request
     * @param newRequestSource New Chainlink functions source code
     * @param newRequestArgs New Chainlink functions arguments
     * @param newFulfillGasLimit New Chainlink functions fulfill gas limit
     */
    function setFunctionsRequest(
        string calldata newRequestSource,
        string[] calldata newRequestArgs,
        uint32 newFulfillGasLimit
    ) external;

    /**
     * @notice Set a new Chainlink functions oracle address
     * @param newFunctionsOracleAddress New Chainlink functions oracle address
     */
    function setFunctionsOracle(address newFunctionsOracleAddress) external;

    /// @notice Get the report beacon balance
    function getReportBeaconBalance() external view returns (uint256);

    /// @notice Get the report remaining requests
    function getReportRemainingRequests() external view returns (uint256);

    /**
     * @notice Get a request type by ID
     * @param requestId Request ID
     */
    function getRequestType(bytes32 requestId) external view returns (RequestType);

    /// @notice Check if the upkeep is needed
    function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory);

    /// @notice Whether compound stake is enabled
    function compoundStake() external view returns (bool);
}
