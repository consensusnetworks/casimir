// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './ICasimirManager.sol';

interface ICasimirRegistry {
    event OperatorRegistered(uint64 operatorId);
    event DeregistrationRequested(uint64 operatorId);
    event DeregistrationCompleted(uint64 operatorId);

    struct Operator {
        bool active;
        int256 collateral;
        uint256 poolCount;
        mapping(uint32 => bool active) activePools;
        bool deregistering;
    }

    function registerOperator(uint64 operatorId) external payable;

    function requestOperatorDeregistration(uint64 operatorId) external;

    function deregisterOperator(uint64 operatorId) external;

    function depositCollateral(uint64 operatorId) external payable;

    function addActivePool(uint32 poolId, uint64 operatorId) external;

    function removeActivePool(uint32 poolId, uint64 operatorId, uint256 blameAmount) external;

    function getOperatorCollateral(uint64 operatorId) external view returns (int256); 
}