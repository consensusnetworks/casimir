// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/interfaces/IERC20.sol';

/**
 * @title WETH (wrapped ETH ERC-20) interface
 */
interface IWETH9 is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 _amount) external;
}