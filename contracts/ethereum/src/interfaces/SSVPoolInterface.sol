// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

/**
 * @title Pool interface that groups and stakes deposits
 */
interface SSVPoolInterface {
    function deposit(address userAddress) external payable;
    function getBalance() external view returns (uint256);
    function getUserBalance(address userAddress) external view returns (uint256);
}