// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./ICasimirCore.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

interface ICasimirUpkeep is ICasimirCore, AutomationCompatibleInterface {
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

    /**
     * @notice Fulfill the request directly without functions billing
     * @param requestId Request ID
     * @param response Response
     * @param err Execution error
     */
    function fulfillRequestDirect(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) external;

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

    /// @notice Set the transmitter address
    function setTransmitter(address newTransmitterAddress) external;

    /// @notice Check if the upkeep is needed
    function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory);

    /// @notice Whether compound stake is enabled
    function compoundStake() external view returns (bool);
}
