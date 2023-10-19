// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./ICasimirCore.sol";

interface ICasimirViews is ICasimirCore {
    /**
     * @notice Get the next five compoundable pool IDs
     * @param startIndex Start index
     * @param endIndex End index
     */
    function getCompoundablePoolIds(uint256 startIndex, uint256 endIndex) external view returns (uint32[5] memory);

    /// @notice Get the deposited pool count
    function getDepositedPoolCount() external view returns (uint256);

    /**
     * @notice Get the deposited pool public keys
     * @param startIndex Start index
     * @param endIndex End index
     */
    function getDepositedPoolPublicKeys(uint256 startIndex, uint256 endIndex) external view returns (bytes[] memory);

    /**
     * @notice Get the deposited pool statuses
     * @param startIndex Start index
     * @param endIndex End index
     */
    function getDepositedPoolStatuses(uint256 startIndex, uint256 endIndex) external view returns (PoolStatus[] memory);

    /**
     * @notice Get operators
     * @param startIndex Start index
     * @param endIndex End index
     */
    function getOperators(uint256 startIndex, uint256 endIndex) external view returns (Operator[] memory);

    /**
     * @notice Get pool config
     * @param poolId Pool ID
     */
    function getPoolConfig(uint32 poolId) external view returns (PoolConfig memory);

    /**
     * @notice Get the swept balance (in gwei)
     * @param startIndex Start index
     * @param endIndex End index
     */
    function getSweptBalance(uint256 startIndex, uint256 endIndex) external view returns (uint128);
}
