// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./CasimirCore.sol";
import "./interfaces/ICasimirRegistry.sol";
import "./interfaces/ICasimirManager.sol";
import "./vendor/interfaces/ISSVViews.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title Registry for pool operators
 */
contract CasimirRegistry is
    ICasimirRegistry,
    CasimirCore,
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    /// @inheritdoc ICasimirRegistry
    uint256 public minCollateral;
    /// @inheritdoc ICasimirRegistry
    bool public privateOperators;
    /// @inheritdoc ICasimirRegistry
    bool public verifiedOperators;
    /**
     * @dev SSV views contract
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    ISSVViews private immutable ssvViews;
    /// @dev Manager contract
    ICasimirManager private manager;
    /// @dev Previously registered operator IDs
    uint64[] private operatorIds;
    /// @dev Operators by ID
    mapping(uint64 => Operator) private operators;
    /// @dev Operator pools by operator ID and pool ID
    mapping(uint64 => mapping(uint32 => bool)) private operatorPools;
    /// @dev Storage gap
    uint256[50] private __gap;

    /**
     * @dev Constructor
     * @param ssvViews_ SSV views contract
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(ISSVViews ssvViews_) {
        onlyAddress(address(ssvViews_));
        ssvViews = ssvViews_;
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param minCollateral_ Minimum collateral per operator per pool
     * @param privateOperators_ Whether private operators are enabled
     * @param verifiedOperators_ Whether verified operators are enabled
     */
    function initialize(uint256 minCollateral_, bool privateOperators_, bool verifiedOperators_) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        manager = ICasimirManager(msg.sender);
        minCollateral = minCollateral_;
        privateOperators = privateOperators_;
        verifiedOperators = verifiedOperators_;
    }

    /// @inheritdoc ICasimirRegistry
    function registerOperator(uint64 operatorId) external payable {
        onlyOperatorOwner(operatorId);
        Operator storage operator = operators[operatorId];
        if (operator.id != 0) {
            revert OperatorAlreadyRegistered();
        }
        operatorIds.push(operatorId);
        operator.id = operatorId;
        operator.active = true;
        operator.collateral = msg.value;
        emit OperatorRegistered(operatorId);
    }

    /// @inheritdoc ICasimirRegistry
    function depositCollateral(uint64 operatorId) external payable {
        onlyOperatorOwner(operatorId);
        Operator storage operator = operators[operatorId];
        operator.collateral += msg.value;
        operator.active = true;
        emit CollateralDeposited(operatorId, msg.value);
    }

    /// @inheritdoc ICasimirRegistry
    function requestWithdrawal(uint64 operatorId, uint256 amount) external {
        onlyOperatorOwner(operatorId);
        Operator storage operator = operators[operatorId];
        if (operator.active || operator.resharing) {
            revert CollateralInUse();
        }
        if (operator.collateral < amount) {
            revert InvalidAmount();
        }
        operator.collateral -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }
        emit WithdrawalFulfilled(operatorId, amount);
    }

    /// @inheritdoc ICasimirRegistry
    function requestDeactivation(uint64 operatorId) external {
        onlyOperatorOwner(operatorId);
        Operator storage operator = operators[operatorId];
        if (!operator.active) {
            revert OperatorNotActive();
        }
        if (operator.resharing) {
            revert OperatorResharing();
        }
        if (operator.poolCount == 0) {
            operator.active = false;
            emit DeactivationCompleted(operatorId);
        } else {
            operator.resharing = true;
            emit DeactivationRequested(operatorId);
        }
    }

    /// @inheritdoc ICasimirRegistry
    function addOperatorPool(uint64 operatorId, uint32 poolId) external onlyOwner {
        Operator storage operator = operators[operatorId];
        if (!operator.active) {
            revert OperatorNotActive();
        }
        if (operator.resharing) {
            revert OperatorResharing();
        }
        if (operatorPools[operatorId][poolId]) {
            revert PoolAlreadyExists();
        }
        uint256 eligiblePools = (operator.collateral / minCollateral) - operator.poolCount;
        if (eligiblePools == 0) {
            revert InsufficientCollateral();
        }
        operatorPools[operatorId][poolId] = true;
        operator.poolCount += 1;
        emit OperatorPoolAdded(operatorId, poolId);
    }

    /// @inheritdoc ICasimirRegistry
    function removeOperatorPool(uint64 operatorId, uint32 poolId, uint256 blameAmount) external {
        onlyOwnerOrPool(poolId);
        Operator storage operator = operators[operatorId];
        if (!operatorPools[operatorId][poolId]) {
            revert PoolDoesNotExist();
        }
        if (blameAmount > minCollateral) {
            revert InvalidAmount();
        }
        operatorPools[operatorId][poolId] = false;
        operator.poolCount -= 1;
        if (operator.poolCount == 0 && operator.resharing) {
            operator.active = false;
            operator.resharing = false;
            emit DeactivationCompleted(operatorId);
        }
        if (blameAmount > 0) {
            operator.collateral -= blameAmount;
            manager.depositRecoveredBalance{value: blameAmount}(poolId);
        }
        emit OperatorPoolRemoved(operatorId, poolId, blameAmount);
    }

    /// @inheritdoc ICasimirRegistry
    function getOperator(uint64 operatorId) external view returns (Operator memory operator) {
        operator = operators[operatorId];
    }

    /// @inheritdoc ICasimirRegistry
    function getOperatorIds() external view returns (uint64[] memory) {
        return operatorIds;
    }

    /// @dev Validate the caller is the owner of the operator
    function onlyOperatorOwner(uint64 operatorId) private view {
        (address operatorOwner, , , , , ) = ssvViews.getOperatorById(operatorId);
        if (msg.sender != operatorOwner) {
            revert Unauthorized();
        }
    }

    /// @dev Validate the caller is the owner or the authorized pool
    function onlyOwnerOrPool(uint32 poolId) private view {
        if (msg.sender != owner() && msg.sender != manager.getPoolAddress(poolId)) {
            revert Unauthorized();
        }
    }
}
