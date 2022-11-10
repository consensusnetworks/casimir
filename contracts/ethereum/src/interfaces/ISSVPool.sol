// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.16;

/**
 * @title Pool interface that groups and stakes deposits
 */
interface ISSVPool {
    function deposit(address userAddress) external payable;
    function getBalance() external view returns (uint256);
    function getUserBalance(address userAddress) external view returns (uint256);
}