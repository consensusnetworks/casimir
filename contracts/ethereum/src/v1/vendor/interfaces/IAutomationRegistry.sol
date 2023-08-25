// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

interface IAutomationRegistry {
    function addFunds(uint256 id, uint96 amount) external;
    function cancelUpkeep(uint256 id) external;
}