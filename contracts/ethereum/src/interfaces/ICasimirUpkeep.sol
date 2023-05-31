// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

interface ICasimirUpkeep is AutomationCompatibleInterface {
    /***************/
    /* Enumerators */
    /***************/

    /** Upkeep statuses */
    enum Status {
        FINALIZED,
        REQUESTING,
        PROCESSING
    }

    /**********/
    /* Events */
    /**********/
    
    event OCRResponse(bytes32 indexed requestId, bytes result, bytes err);
    event UpkeepPerformed(Status status);

    /*************/
    /* Functions */
    /*************/

    function checkUpkeep(
        bytes calldata checkData
    ) external returns (bool upkeepNeeded, bytes memory performData);

    function performUpkeep(bytes calldata performData) external;

    function setOracleAddress(address oracleAddress) external;

    function mockFulfillRequest(
        bytes32 requestId,
        bytes memory result,
        bytes memory err
    ) external;
}
