// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './interfaces/ICasimirRegistry.sol';
import './interfaces/ICasimirManager.sol';
import './libraries/Types.sol';
import './vendor/interfaces/ISSVNetworkViews.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Registry contract that manages operators
 */
contract CasimirRegistry is ICasimirRegistry, Ownable {
    /*************/
    /* Libraries */
    /*************/

    /** Use internal type for address */
    using TypesAddress for address;

    /*************/
    /* Constants */
    /*************/

    /** Required collateral per operator per pool */
    uint256 private constant requiredCollateral = 1 ether;

    /*************/
    /* Immutable */
    /*************/

    /** Manager contract */
    ICasimirManager private immutable manager;
    /** SSV network views contract */
    ISSVNetworkViews private immutable ssvNetworkViews;

    /*********/
    /* State */
    /*********/

    /** Operator IDs */
    uint64[] private operatorIds;
    /** Operators */
    mapping(uint64 => Operator) private operators;
    /** Operator pools */
    mapping(uint64 => mapping (uint32 => bool)) private operatorPools;

    /*************/
    /* Modifiers */
    /*************/

    /**
     * @dev Validate the caller is owner or the authorized pool
     */
    modifier onlyOwnerOrPool(uint32 poolId) {
        require(
            msg.sender == owner() ||
                msg.sender == manager.getPoolAddress(poolId),
            "Only owner or the authorized pool can call this function"
        );
        _;
    }

    /**
     * @notice Constructor
     * @param ssvNetworkViewsAddress The SSV network views address
     */
    constructor(address ssvNetworkViewsAddress) {
        manager = ICasimirManager(msg.sender);
        ssvNetworkViews = ISSVNetworkViews(ssvNetworkViewsAddress);
    }

    /**
     * @notice Register an operator with the set
     * @param operatorId The operator ID
     */
    function registerOperator(uint64 operatorId) external payable {
        (address operatorOwner, , , , ) = ssvNetworkViews.getOperatorById(operatorId);
        require(
            msg.sender == operatorOwner,
            "Only operator owner can register"
        );
        require(operatorId != 0, "Invalid operator ID");
        Operator storage operator = operators[operatorId];
        require(operator.id == 0, "Operator already registered");

        operatorIds.push(operatorId);
        operator.id = operatorId;
        operator.active = true;
        operator.collateral = msg.value;

        emit OperatorRegistered(operatorId);
    }

    /**
     * @notice Deposit collateral for an operator
     * @param operatorId The operator ID
     */
    function depositCollateral(uint64 operatorId) external payable {
        Operator storage operator = operators[operatorId];
        (address operatorOwner, , , , ) = ssvNetworkViews.getOperatorById(
            operatorId
        );
        require(
            msg.sender == operatorOwner,
            "Only operator owner can deposit collateral"
        );

        operator.collateral += msg.value;
        operator.active = true;

        emit CollateralDeposited(operatorId, msg.value);
    }

    /**
     * @notice Request to withdraw collateral from an operator
     * @param operatorId The operator ID
     * @param amount The amount to withdraw
     */
    function requestWithdrawal(uint64 operatorId, uint256 amount) external {
        Operator storage operator = operators[operatorId];
        (address operatorOwner, , , , ) = ssvNetworkViews.getOperatorById(operatorId);
        require(
            msg.sender == operatorOwner,
            "Not operator owner"
        );
        require(
            !operator.active &&
            !operator.resharing &&
            operator.collateral >= amount,
            "Not allowed to withdraw amount"
        );

        operator.collateral -= amount;
        operatorOwner.send(amount);

        emit WithdrawalFulfilled(operatorId, amount);
    }

    /**
     * @notice Request to deactivate an operator
     * @param operatorId The operator ID
     */
    function requestDeactivation(uint64 operatorId) external {
        Operator storage operator = operators[operatorId];
        (address operatorOwner, , , , ) = ssvNetworkViews.getOperatorById(operatorId);
        require(
            msg.sender == operatorOwner,
            "Not operator owner"
        );
        require(operator.active, "Operator is not active");
        require(!operator.resharing, "Operator is resharing");

        if (operator.poolCount == 0) {
            operator.active = false;
        } else {
            operator.resharing = true;
            manager.requestReshares(operatorId);
        }

        emit DeactivationRequested(operatorId);
    }

    /**
     * @notice Add a pool to an operator
     * @param operatorId The operator ID
     * @param poolId The pool ID
     */
    function addOperatorPool(
        uint64 operatorId,
        uint32 poolId
    ) external onlyOwner {
        Operator storage operator = operators[operatorId];
        require(operator.active, "Operator not active");
        require(!operator.resharing, "Operator resharing");
        require(!operatorPools[operatorId][poolId], "Pool already active");
        uint256 eligiblePools = (operator.collateral / requiredCollateral) - operator.poolCount;
        require(eligiblePools > 0, "No remaining eligible pools");

        operatorPools[operatorId][poolId] = true;
        operator.poolCount += 1;

        emit OperatorPoolAdded(operatorId, poolId);
    }

    /**
     * @notice Remove a pool from an operator
     * @param operatorId The operator ID
     * @param poolId The pool ID
     * @param blameAmount The amount to recover from collateral
     */
    function removeOperatorPool(
        uint64 operatorId,
        uint32 poolId,
        uint256 blameAmount
    ) external onlyOwnerOrPool(poolId) {
        Operator storage operator = operators[operatorId];
        require(operatorPools[operatorId][poolId], "Pool is not active for operator");
        require(blameAmount <= requiredCollateral, "Blame amount is more than collateral");

        operatorPools[operatorId][poolId] = false;
        operator.poolCount -= 1;

        if (operator.poolCount == 0 && operator.resharing) {
            operator.active = false;
            operator.resharing = false;
        }

        if (blameAmount > 0) {
            operator.collateral -= blameAmount;
            manager.depositRecoveredBalance{value: blameAmount}(poolId);
        }

        emit OperatorPoolRemoved(operatorId, poolId, blameAmount);
    }

    /**
     * @notice Get an operator by ID
     * @param operatorId The operator ID
     * @return operator The operator
     */
    function getOperator(
        uint64 operatorId
    ) external view returns (Operator memory operator) {
        return operators[operatorId];
    }

    /**
     * @notice Get the operator IDs
     * @return operatorIds The operator IDs
     */
    function getOperatorIds() external view returns (uint64[] memory) {
        return operatorIds;
    }
}