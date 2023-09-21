// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./interfaces/ICasimirPool.sol";
import "./interfaces/ICasimirManager.sol";
import "./interfaces/ICasimirRegistry.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title Pool contract that accepts deposits and stakes a validator
 */
contract CasimirPool is ICasimirPool, Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    /*************/
    /* Constants */
    /*************/

    /** Pool capacity */
    uint256 private constant POOL_CAPACITY = 32 ether;

    /*********/
    /* State */
    /*********/

    /** Manager contract */
    ICasimirManager private manager;
    /** Registry contract */
    ICasimirRegistry private registry;
    /** Pool ID */
    uint32 private id;
    /** Validator public key */
    bytes private publicKey;
    /** Operator IDs */
    uint64[] private operatorIds;
    /** Reshares */
    uint256 private reshares;
    /** Status */
    PoolStatus private status;
    /** Storage gap */
    uint256[50] private __gap;

    // @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param registryAddress The registry address
     * @param _id The pool ID
     * @param _publicKey The validator public key
     * @param _operatorIds The operator IDs
     */
    function initialize(
        address registryAddress,
        uint32 _id,
        bytes memory _publicKey,
        uint64[] memory _operatorIds
    ) public initializer {
        if (registryAddress == address(0)) {
            revert InvalidAddress();
        }
        
        __Ownable_init();
        __ReentrancyGuard_init();
        manager = ICasimirManager(msg.sender);
        registry = ICasimirRegistry(registryAddress);
        id = _id;
        publicKey = _publicKey;
        operatorIds = _operatorIds;
    }

    /**
     * @notice Deposit rewards from a pool to the manager
     */
    function depositRewards() external onlyOwner {
        if (status != PoolStatus.ACTIVE) {
            revert Inactive();
        }

        uint256 balance = address(this).balance;
        manager.depositRewards{value: balance}(id);
    }

    /**
     * @notice Withdraw balance from a pool to the manager
     * @param blamePercents The operator loss blame percents
     */
    function withdrawBalance(uint32[] memory blamePercents) external onlyOwner {
        if (status != PoolStatus.WITHDRAWN) {
            revert NotWithdrawn();
        }

        uint256 balance = address(this).balance;
        int256 rewards = int256(balance) - int256(POOL_CAPACITY);
        if (rewards > 0) {
            manager.depositRewards{value: uint256(rewards)}(id);
        }
        for (uint256 i = 0; i < blamePercents.length; i++) {
            uint256 blameAmount;
            if (rewards < 0) {
                uint256 blamePercent = blamePercents[i];
                blameAmount = MathUpgradeable.mulDiv(uint256(-rewards), blamePercent, 100);
            }
            registry.removeOperatorPool(operatorIds[i], id, blameAmount);
        }
        manager.depositExitedBalance{value: balance}(id);
    }

    /**
     * @notice Set the operator IDs
     * @param _operatorIds The operator IDs
     */
    function setOperatorIds(uint64[] memory _operatorIds) external onlyOwner {
        operatorIds = _operatorIds;

        emit OperatorIdsSet(_operatorIds);
    }

    /**
     * @notice Set the reshare count
     * @param newReshares The new reshare count
     */
    function setReshares(uint256 newReshares) external onlyOwner {
        reshares = newReshares;

        emit ResharesSet(newReshares);
    }

    /**
     * @notice Set the pool status
     * @param newStatus The new pool status
     */
    function setStatus(PoolStatus newStatus) external onlyOwner {
        status = newStatus;

        emit StatusSet(newStatus);
    }

    /**
     * @notice Get the pool details
     * @return poolDetails The pool details
     */
    function getDetails()
        external
        view
        returns (PoolDetails memory poolDetails)
    {
        poolDetails = PoolDetails({
            id: id,
            balance: address(this).balance,
            publicKey: publicKey,
            operatorIds: operatorIds,
            reshares: reshares,
            status: status
        });
    }
}
