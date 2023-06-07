// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './ICasimirManager.sol';

interface ICasimirRegistry {
    event OperatorRegistered(uint64 operatorId);
    event DeregistrationRequested(uint64 operatorId);
    event DeregistrationCompleted(uint64 operatorId);

    struct Operator {
        uint64 id;
        bool active;
        bool resharing;
        int256 collateral;
        uint256 poolCount;
    }

    function registerOperator(uint64 operatorId) external payable;
    function depositCollateral(uint64 operatorId) external payable;
    function withdrawCollateral(uint64 operatorId, uint256 amount) external;
    function requestDeregistration(uint64 operatorId) external;
    function addOperatorPool(uint64 operatorId, uint32 poolId) external;
    function removeOperatorPool(uint64 operatorId, uint32 poolId, uint256 blameAmount) external;
    function getOperator(uint64 operatorId) external view returns (Operator memory);
    function getOperatorIds() external view returns (uint64[] memory);
}