// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./CasimirCore.sol";
import "./interfaces/ICasimirPool.sol";
import "./interfaces/ICasimirManager.sol";
import "./interfaces/ICasimirRegistry.sol";
import "./vendor/interfaces/IDepositContract.sol";
import "./vendor/interfaces/IEigenPod.sol";
import "./vendor/interfaces/IEigenPodManager.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/// @title Pool that accepts deposits and stakes a validator
contract CasimirPool is ICasimirPool, CasimirCore, Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    /// @inheritdoc ICasimirPool
    bytes public publicKey;
    /// @inheritdoc ICasimirPool
    uint256 public reshares;
    /// @inheritdoc ICasimirPool
    PoolStatus public status;
    /** 
     * @dev Beacon deposit contract
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    IDepositContract private immutable depositContract;
    /**
     * @dev Eigen pod manager contract
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    IEigenPodManager private immutable eigenPodManager;
    /// @dev Pool deposit capacity
    uint256 private constant POOL_CAPACITY = 32 ether;
    /// @dev Operator IDs
    uint64[] private operatorIds;
    /// @dev Pool ID
    uint32 private poolId;
    /// @dev Operator key shares
    bytes private shares;
    /// @dev Manager contract
    ICasimirManager private manager;
    /// @dev Registry contract
    ICasimirRegistry private registry;
    /// @dev Eigen pod contract
    IEigenPod private eigenPod;
    /// @dev Storage gap
    uint256[49] private __gap;

    /**
     * @dev Constructor
     * @param depositContract_ Beacon deposit contract
     * @param eigenPodManager_ Eigen pod manager
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(
        IDepositContract depositContract_,
        IEigenPodManager eigenPodManager_
    ) {
        onlyAddress(address(depositContract_));
        onlyAddress(address(eigenPodManager_));
        depositContract = depositContract_;
        eigenPodManager = eigenPodManager_;
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param registry_ Registry contract
     * @param operatorIds_ The operator IDs
     * @param poolId_ Pool ID
     * @param publicKey_ The validator public key
     */
    function initialize(
        ICasimirRegistry registry_,
        uint64[] memory operatorIds_,
        uint32 poolId_,
        bytes memory publicKey_,
        bytes memory shares_
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        manager = ICasimirManager(msg.sender);
        registry = registry_;
        poolId = poolId_;
        operatorIds = operatorIds_;
        publicKey = publicKey_;
        shares = shares_;
    }

    /// @inheritdoc ICasimirPool
    function depositStake(
        bytes32 depositDataRoot,
        bytes memory signature,
        bytes memory withdrawalCredentials
    ) external payable onlyOwner {
        if (status != PoolStatus.READY) {
            revert PoolAlreadyInitiated();
        }
        if (msg.value != POOL_CAPACITY) {
            revert InvalidDepositAmount();
        }
        status = PoolStatus.PENDING;
        if (manager.eigenStake()) {
            eigenPod = eigenPodManager.getPod(address(this));
            validateWithdrawalCredentials(address(eigenPod), withdrawalCredentials);
            eigenPodManager.stake{value: msg.value}(publicKey, signature, depositDataRoot);
        } else {
            validateWithdrawalCredentials(address(this), withdrawalCredentials);
            depositContract.deposit{value: msg.value}(publicKey, withdrawalCredentials, signature, depositDataRoot);
        }
    }

    /// @inheritdoc ICasimirPool
    function depositRewards() external onlyOwner {
        if (status != PoolStatus.ACTIVE) {
            revert PoolNotActive();
        }
        uint256 balance = address(this).balance;
        manager.depositRewards{value: balance}(poolId);
    }

    /// @inheritdoc ICasimirPool
    function setOperatorIds(uint64[] memory newOperatorIds) external onlyOwner {
        operatorIds = newOperatorIds;
        emit OperatorIdsSet(newOperatorIds);
    }

    /// @inheritdoc ICasimirPool
    function setReshares(uint256 newReshares) external onlyOwner {
        reshares = newReshares;
        emit ResharesSet(newReshares);
    }

    /// @inheritdoc ICasimirPool
    function setStatus(PoolStatus newStatus) external onlyOwner {
        status = newStatus;
        emit StatusSet(newStatus);
    }

    /// @inheritdoc ICasimirPool
    function withdrawBalance(uint32[] memory blamePercents) external onlyOwner {
        if (status != PoolStatus.EXITING_FORCED && status != PoolStatus.EXITING_REQUESTED) {
            revert NotExiting();
        }
        if (status == PoolStatus.WITHDRAWN) {
            revert PoolAlreadyWithdrawn();
        }
        status = PoolStatus.WITHDRAWN;
        uint256 balance = address(this).balance;
        int256 rewards = int256(balance) - int256(POOL_CAPACITY);
        if (rewards > 0) {
            manager.depositRewards{value: uint256(rewards)}(poolId);
        }
        for (uint256 i; i < blamePercents.length; i++) {
            uint256 blameAmount;
            if (rewards < 0) {
                uint256 blamePercent = blamePercents[i];
                blameAmount = MathUpgradeable.mulDiv(uint256(-rewards), blamePercent, 100);
            }
            registry.removeOperatorPool(operatorIds[i], poolId, blameAmount);
        }
        manager.depositWithdrawnBalance{value: balance}(poolId);
    }

    /// @inheritdoc ICasimirPool
    function getOperatorIds() external view returns (uint64[] memory) {
        return operatorIds;
    }

    /// @inheritdoc ICasimirPool
    function getRegistration() external view returns (PoolRegistration memory) {
        return PoolRegistration({operatorIds: operatorIds, publicKey: publicKey, shares: shares, status: status});
    }

    /// @dev Validate the withdrawal credentials are correct for the withdrawal address
    function validateWithdrawalCredentials(address withdrawalAddress, bytes memory withdrawalCredentials) internal pure {
        bytes memory computedWithdrawalCredentials = abi.encodePacked(bytes1(uint8(1)), bytes11(0), withdrawalAddress);
        if (keccak256(computedWithdrawalCredentials) != keccak256(withdrawalCredentials)) {
            revert InvalidWithdrawalCredentials();
        }
    }
}
