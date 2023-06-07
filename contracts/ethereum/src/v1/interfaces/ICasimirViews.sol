// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './ICasimirRegistry.sol';

interface ICasimirViews {
    /***********/
    /* Structs */
    /***********/

    struct PoolDetails {
        uint32 id;
        uint256 balance;
        bytes publicKey;
        uint64[] operatorIds;
        ICasimirPool.PoolStatus status;
    }

    /***********/
    /* Getters */
    /***********/

    function getCompoundablePoolIds(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (uint32[5] memory);
    function getOperators(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (ICasimirRegistry.Operator[] memory);
    function getPoolDetails(
        uint32 poolId
    ) external view returns (PoolDetails memory);
    function getSweptBalance(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (uint256);
}