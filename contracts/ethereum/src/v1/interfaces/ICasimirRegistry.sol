// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './ICasimirManager.sol';

interface ICasimirRegistry {

    /***********/
    /* Structs */
    /***********/

    struct Operator {
        uint64 id;
        bool active;
        bool resharing;
        uint256 collateral;
        uint256 poolCount;
    }

    /**********/
    /* Events */
    /**********/

    event OperatorRegistered(uint64 indexed operatorId);
    event DeregistrationRequested(uint64 indexed operatorId);
    event DeregistrationCompleted(uint64 indexed operatorId);

    /*************/
    /* Mutations */
    /*************/

    function registerOperator(uint64 operatorId) external payable;
    function depositCollateral(uint64 operatorId) external payable;
    function requestWithdrawal(uint64 operatorId, uint256 amount) external;
    function requestDeregistration(uint64 operatorId) external;
    function addOperatorPool(uint64 operatorId, uint32 poolId) external;
    function removeOperatorPool(uint64 operatorId, uint32 poolId, uint256 blameAmount) external;

    /***********/
    /* Getters */
    /***********/
    
    function getOperator(uint64 operatorId) external view returns (Operator memory);
    function getOperatorIds() external view returns (uint64[] memory);
}