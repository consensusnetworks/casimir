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
    event UpkeepPerformed(ReportStatus indexed status);

    /*************/
    /* Mutations */
    /*************/

    function performUpkeep(bytes calldata performData) external;
    function setOracleAddress(address oracleAddress) external;
    function mockFulfillRequest(
        bytes32 requestId,
        bytes memory result,
        bytes memory err
    ) external;

    /***********/
    /* Getters */
    /***********/

    function checkUpkeep(
        bytes calldata checkData
    ) external returns (bool upkeepNeeded, bytes memory performData);



}
