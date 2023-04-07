// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/PoRAddressList.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationCompatibleInterface.sol";

interface ISSVAutomation is AutomationCompatibleInterface, PoRAddressList {

    /*************/
    /* Functions */
    /*************/

    function checkUpkeep(bytes calldata checkData) external returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
    function validateUpkeep() external view returns (bool upkeepNeeded);
    function getPoRAddressListLength() external view returns (uint256);
    function getPoRAddressList(uint256 startIndex, uint256 endIndex) external view returns (string[] memory);
}