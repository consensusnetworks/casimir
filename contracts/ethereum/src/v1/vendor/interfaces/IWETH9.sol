// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Interface for WETH9
interface IWETH9 is IERC20 {
    /// @notice Deposit ether to get wrapped ether
    function deposit() external payable;

    /**
     * @notice Withdraw wrapped ether to get ether
     * @param amount Amount of wrapped ether to withdraw
     */
    function withdraw(uint256 amount) external;
}
