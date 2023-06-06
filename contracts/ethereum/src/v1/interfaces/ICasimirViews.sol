// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

interface ICasimirViews {
    function getCompoundablePoolIds(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (uint32[5] memory);
    function getSweptBalance(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (uint256);
}