// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

/// @title Interface for WETH9
interface ISSVToken is IERC20 {
    /**
     * @notice Mint tokens
     * @param to The target address
     * @param amount The amount of token to mint
     */
    function mint(address to, uint256 amount) external;
}