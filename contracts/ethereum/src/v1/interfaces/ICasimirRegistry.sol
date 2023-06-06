// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './ICasimirManager.sol';

interface ICasimirRegistry {
    event OperatorRegistered(uint64 operatorId);
    event DeregistrationRequested(uint64 operatorId);
    event DeregistrationCompleted(uint64 operatorId);

    struct Operator {
        bool active;
        bool resharing;
        int256 collateral;
        uint256 poolCount;
        mapping(uint32 => bool active) pools;
    }

    function registerOperator(uint64 operatorId) external payable;
    function depositCollateral(uint64 operatorId) external payable;
    function withdrawCollateral(uint64 operatorId, uint256 amount) external;
    function addOperatorPool(uint64 operatorId, uint32 poolId) external;
    function removeOperatorPool(uint64 operatorId, uint32 poolId, uint256 blameAmount) external;
    function getOperatorCollateral(uint64 operatorId) external view returns (int256);
    function getOperatorEligibility(uint64 operatorId) external view returns (bool eligibility);
    function getOperatorIds() external view returns (uint64[] memory);
}