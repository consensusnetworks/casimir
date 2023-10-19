// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./ICasimirCore.sol";

interface ICasimirRegistry is ICasimirCore {
    event CollateralDeposited(uint64 indexed operatorId, uint256 amount);
    event DeactivationCompleted(uint64 indexed operatorId);
    event DeactivationRequested(uint64 indexed operatorId);
    event DeregistrationCompleted(uint64 indexed operatorId);
    event OperatorPoolAdded(uint64 indexed operatorId, uint32 poolId);
    event OperatorPoolRemoved(uint64 operatorId, uint32 poolId, uint256 blameAmount);
    event OperatorRegistered(uint64 indexed operatorId);
    event WithdrawalFulfilled(uint64 indexed operatorId, uint256 amount);

    error CollateralInUse();
    error InsufficientCollateral();
    error OperatorAlreadyRegistered();
    error OperatorNotActive();
    error OperatorResharing();
    error PoolAlreadyExists();
    error PoolDoesNotExist();

    /**
     * @notice Register an operator
     * @param operatorId Operator ID
     */
    function registerOperator(uint64 operatorId) external payable;

    /**
     * @notice Deposit operator collateral
     * @param operatorId Operator ID
     */
    function depositCollateral(uint64 operatorId) external payable;

    /**
     * @notice Request to withdraw operator collateral
     * @param operatorId Operator ID
     * @param amount Amount to withdraw
     */
    function requestWithdrawal(uint64 operatorId, uint256 amount) external;

    /**
     * @notice Request operator deactivation
     * @param operatorId Operator ID
     */
    function requestDeactivation(uint64 operatorId) external;

    /**
     * @notice Add a pool to an operator
     * @param operatorId Operator ID
     * @param poolId Pool ID
     */
    function addOperatorPool(uint64 operatorId, uint32 poolId) external;

    /**
     * @notice Remove a pool from an operator
     * @param operatorId Operator ID
     * @param poolId Pool ID
     * @param blameAmount Amount to recover from collateral
     */
    function removeOperatorPool(uint64 operatorId, uint32 poolId, uint256 blameAmount) external;

    /**
     * @notice Get an operator
     * @param operatorId Operator ID
     */
    function getOperator(uint64 operatorId) external view returns (Operator memory);

    /// @notice Get all previously registered operator IDs
    function getOperatorIds() external view returns (uint64[] memory);

    /// @notice Minimum collateral per operator per pool
    function minCollateral() external view returns (uint256);

    /// @notice Whether private operators are enabled
    function privateOperators() external view returns (bool);

    /// @notice Whether verified operators are enabled
    function verifiedOperators() external view returns (bool);
}
