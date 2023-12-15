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

    /// @notice Get the pending pool count
    function getPendingPoolCount() external view returns (uint256);

    /** 
     * @notice Get the pending pool public keys
     * @param startIndex Start index
     * @param endIndex End index
     */
    function getPendingPoolPublicKeys(uint256 startIndex, uint256 endIndex) external view returns (bytes[] memory);

    /// @notice Get the staked pool count
    function getStakedPoolCount() external view returns (uint256);

    /**
     * @notice Get the staked pool public keys
     * @param startIndex Start index
     * @param endIndex End index
     */
    function getStakedPoolPublicKeys(uint256 startIndex, uint256 endIndex) external view returns (bytes[] memory);

    /**
     * @notice Get the staked pool statuses
     * @param startIndex Start index
     * @param endIndex End index
     */
    function getStakedPoolStatuses(uint256 startIndex, uint256 endIndex) external view returns (PoolStatus[] memory);

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
