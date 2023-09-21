// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

interface ICasimirUpkeep is AutomationCompatibleInterface {
    /***************/
    /* Enumerators */
    /***************/

    enum RequestType {
        NONE,
        BALANCES,
        DETAILS
    }
    enum ReportStatus {
        FINALIZED,
        REQUESTING,
        PROCESSING
    }

    /**********/
    /* Events */
    /**********/

    event OCRResponse(bytes32 indexed requestId, bytes result, bytes err);
    event FunctionsRequestSet(
        string newRequestSource,
        string[] newRequestArgs,
        uint32 newFulfillGasLimit
    );
    event FunctionsOracleAddressSet(address newFunctionsOracleAddress);
    event UpkeepPerformed(ReportStatus indexed status);
    
    /**********/
    /* Errors */
    /**********/

    error InvalidAddress();
    error InvalidRequest();
    error NotNeeded();

    /*************/
    /* Mutations */
    /*************/

    function performUpkeep(bytes calldata performData) external;

    function setFunctionsRequest(
        string calldata newRequestSource,
        string[] calldata newRequestArgs,
        uint32 newFulfillGasLimit
    ) external;

    function setFunctionsOracleAddress(
        address newFunctionsOracleAddress
    ) external;

    /***********/
    /* Getters */
    /***********/

    function checkUpkeep(
        bytes calldata checkData
    ) external returns (bool upkeepNeeded, bytes memory performData);
}
