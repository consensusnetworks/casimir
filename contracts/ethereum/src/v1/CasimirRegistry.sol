// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./interfaces/ICasimirRegistry.sol";
import "./interfaces/ICasimirManager.sol";
import "./libraries/Types.sol";
import "./vendor/interfaces/ISSVNetworkViews.sol";
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

    /** Required collateral */
    uint256 private requiredCollateral = 4 ether;
    /** Minimum collateral deposit (0.1 ETH) */
    uint256 private minimumCollateralDeposit = 100000000 gwei;

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
    mapping(uint64 => mapping(uint32 => bool)) private operatorPools;

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
        require(
            msg.value >= requiredCollateral,
            "Insufficient registration collateral"
        );
        (address operatorOwner, , , , ) = ssvNetworkViews.getOperatorById(
            operatorId
        );
        require(
            msg.sender == operatorOwner,
            "Only operator owner can register"
        );

        operatorIds.push(operatorId);
        Operator storage operator = operators[operatorId];
        operator.id = operatorId;
        operator.active = true;
        operator.collateral = int256(msg.value);

        emit OperatorRegistered(operatorId);
    }

    /**
     * @notice Deposit collateral for an operator
     * @param operatorId The operator ID
     */
    function depositCollateral(uint64 operatorId) external payable {
        require(
            msg.value > minimumCollateralDeposit,
            "Insufficient collateral deposit"
        );
        Operator storage operator = operators[operatorId];
        (address operatorOwner, , , , ) = ssvNetworkViews.getOperatorById(
            operatorId
        );
        require(
            msg.sender == operatorOwner,
            "Only operator owner can deposit collateral"
        );

        operator.collateral += int256(msg.value);

        if (operator.collateral >= int256(requiredCollateral)) {
            operator.active = true;
        }
    }

    /**
     * @notice Request to withdraw collateral from an operator
     * @param operatorId The operator ID
     * @param amount The amount to withdraw
     */
    function requestWithdrawal(uint64 operatorId, uint256 amount) external {
        Operator storage operator = operators[operatorId];
        (address operatorOwner, , , , ) = ssvNetworkViews.getOperatorById(
            operatorId
        );
        require(msg.sender == operatorOwner, "Not operator owner");
        require(
            (!operator.active &&
                !operator.resharing &&
                operator.collateral >= int256(amount)) ||
                operator.collateral >= int256(requiredCollateral),
            "Not allowed to withdraw amount"
        );

        operator.collateral -= int256(amount);
        operatorOwner.send(amount);
    }

    /**
     * @notice Request deregistration for an operator
     * @param operatorId The operator ID
     */
    function requestDeregistration(uint64 operatorId) external {
        Operator storage operator = operators[operatorId];
        (address operatorOwner, , , , ) = ssvNetworkViews.getOperatorById(
            operatorId
        );
        require(msg.sender == operatorOwner, "Not operator owner");
        require(operator.active, "Operator is not active");
        require(!operator.resharing, "Operator is resharing");

        if (operator.poolCount == 0) {
            operator.active = false;
        } else {
            operator.resharing = true;
            manager.requestReshares(operatorId);
        }
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
        require(operator.collateral >= 0, "Operator owes collateral");
        require(!operatorPools[operatorId][poolId], "Pool already active");
        operatorPools[operatorId][poolId] = true;
        operator.poolCount += 1;
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
        require(
            operatorPools[operatorId][poolId],
            "Pool is not active for operator"
        );

        operatorPools[operatorId][poolId] = false;
        operator.poolCount -= 1;

        if (operator.poolCount == 0 && operator.resharing) {
            operator.active = false;
            operator.resharing = false;
        }

        if (blameAmount > 0) {
            uint256 recoverableCollateral;
            if (operator.collateral >= int256(blameAmount)) {
                recoverableCollateral = blameAmount;
            } else if (operator.collateral > 0) {
                recoverableCollateral = uint256(operator.collateral);
            }
            operator.collateral -= int256(blameAmount);

            if (operator.collateral < 0) {
                operator.resharing = true;
                manager.requestReshares(operatorId);
            }

            manager.depositRecoveredBalance{value: recoverableCollateral}(
                poolId
            );
        }
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
