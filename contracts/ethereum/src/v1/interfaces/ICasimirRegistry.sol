// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./ICasimirManager.sol";

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

    event CollateralDeposited(uint64 indexed operatorId, uint256 amount);
    event DeactivationRequested(uint64 indexed operatorId);
    event DeregistrationCompleted(uint64 indexed operatorId);
    event OperatorPoolAdded(uint64 indexed operatorId, uint32 poolId);
    event OperatorPoolRemoved(
        uint64 operatorId,
        uint32 poolId,
        uint256 blameAmount
    );
    event OperatorRegistered(uint64 indexed operatorId);
    event WithdrawalFulfilled(uint64 indexed operatorId, uint256 amount);

    /*************/
    /* Mutations */
    /*************/

    function registerOperator(uint64 operatorId) external payable;

    function depositCollateral(uint64 operatorId) external payable;

    function requestWithdrawal(uint64 operatorId, uint256 amount) external;

    function requestDeactivation(uint64 operatorId) external;

    function addOperatorPool(uint64 operatorId, uint32 poolId) external;

    function removeOperatorPool(
        uint64 operatorId,
        uint32 poolId,
        uint256 blameAmount
    ) external;

    /***********/
    /* Getters */
    /***********/

    function getOperator(
        uint64 operatorId
    ) external view returns (Operator memory);

    function getOperatorIds() external view returns (uint64[] memory);
}
