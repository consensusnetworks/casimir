// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

interface ICasimirRegistry {
    event OperatorRegistered(uint64 operatorId);
    event OperatorDeregistrationRequested(uint64 operatorId);
    event OperatorDeregistrationCompleted(uint64 operatorId);

    struct Operator {
        uint64 id;
        int256 collateral;
        uint256 poolCount;
        bool deregistering;
    }

    function registerOperator(uint64 operatorId) external payable;

    function requestOperatorDeregistration(uint64 operatorId) external;

    function completeOperatorDeregistration(uint64 operatorId) external;

    function depositCollateral(uint64 operatorId) external payable;

    function setOperatorCollateral(uint64 operatorId, int256 collateral) external;

    function getOperatorCollateral(uint64 operatorId) external view returns (int256); 
}