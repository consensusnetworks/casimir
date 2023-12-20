// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

/// @title Interface for Chainlink automation registry
interface IAutomationRegistry {
    struct UpkeepInfo {
        address target;
        uint32 executeGas;
        bytes checkData;
        uint96 balance;
        address admin;
        uint64 maxValidBlocknumber;
        uint32 lastPerformBlockNumber;
        uint96 amountSpent;
        bool paused;
        bytes offchainConfig;
    }

    function getUpkeep(uint256 id) external view returns (UpkeepInfo memory);
    function addFunds(uint256 id, uint96 amount) external;
    function cancelUpkeep(uint256 id) external;
}
