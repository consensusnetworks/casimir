// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

interface ICasimirAutomation is AutomationCompatibleInterface {
    /**********/
    /* Events */
    /**********/
    
    event OCRResponse(bytes32 indexed requestId, bytes result, bytes err);

    /*************/
    /* Functions */
    /*************/

    function checkUpkeep(
        bytes calldata checkData
    ) external returns (bool upkeepNeeded, bytes memory performData);

    function performUpkeep(bytes calldata performData) external;
}
