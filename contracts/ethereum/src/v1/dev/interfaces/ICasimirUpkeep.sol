// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./ICasimirCore.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

interface ICasimirUpkeepDev is ICasimirCoreDev, AutomationCompatibleInterface {
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
    event ForcedExitReportsRequested(uint256 count);
    event CompletedExitReportsRequested(uint256 count);
    event OCRResponse(bytes32 indexed requestId, bytes result, bytes err);
    event FunctionsRequestSet(string newRequestSource, string[] newRequestArgs, uint32 newFulfillGasLimit);
    event FunctionsOracleAddressSet(address newFunctionsOracleAddress);
    event UpkeepPerformed(ReportStatus indexed status);

    error InvalidRequest();
    error UpkeepNotNeeded();

    /// @notice Perform the upkeep
    function performUpkeep(bytes calldata) external;

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

    /// @notice Check if the upkeep is needed
    function checkUpkeep(bytes calldata checkData) external view returns (bool upkeepNeeded, bytes memory);

    /// @notice Whether compound stake is enabled
    function compoundStake() external view returns (bool);
}
