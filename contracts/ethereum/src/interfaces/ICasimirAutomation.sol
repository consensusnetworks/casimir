// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

interface ICasimirAutomation is AutomationCompatibleInterface {
    /***********/
    /* Structs */
    /***********/

    struct OracleReport {
        uint256 activeStake;
        uint256 withdrawnStake;
        // bytes[] exitedValidatorPublicKeys;
        // uint256[] exitedValidatorIndices;
    }

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

    function setOracleAddress(address oracleAddress) external;

    function mockFulfillRequest(
        bytes32 requestId,
        bytes memory result,
        bytes memory err
    ) external;
}
