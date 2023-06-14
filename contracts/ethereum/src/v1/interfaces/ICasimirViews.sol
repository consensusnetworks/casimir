// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './ICasimirPool.sol';
import './ICasimirRegistry.sol';

interface ICasimirViews {
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
    ) external view returns (ICasimirPool.PoolDetails memory);
        function getPendingValidatorPublicKeys(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (bytes[] memory);
    function getStakedValidatorPublicKeys(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (bytes[] memory);
    function getSweptBalance(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (uint256);
}