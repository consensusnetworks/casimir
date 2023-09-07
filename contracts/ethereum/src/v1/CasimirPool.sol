// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./interfaces/ICasimirPool.sol";
import "./interfaces/ICasimirManager.sol";
import "./interfaces/ICasimirRegistry.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Pool contract that accepts deposits and stakes a validator
 */
contract CasimirPool is ICasimirPool, Ownable, ReentrancyGuard {
    /*************/
    /* Constants */
    /*************/

    /** Pool capacity */
    uint256 private constant POOL_CAPACITY = 32 ether;

    /*************/
    /* Immutable */
    /*************/

    /** Manager contract */
    ICasimirManager private immutable manager;
    /** Registry contract */
    ICasimirRegistry private immutable registry;
    /** Pool ID */
    uint32 private immutable id;

    /*********/
    /* State */
    /*********/

    /** Validator public key */
    bytes private publicKey;
    /** Operator IDs */
    uint64[] private operatorIds;
    /** Reshares */
    uint256 private reshares;
    /** Status */
    PoolStatus private status;

    /**
     * @notice Constructor
     * @param registryAddress The registry address
     * @param _id The pool ID
     * @param _publicKey The validator public key
     * @param _operatorIds The operator IDs
     */
    constructor(
        address registryAddress,
        uint32 _id,
        bytes memory _publicKey,
        uint64[] memory _operatorIds
    ) {
        require(registryAddress != address(0), "Missing registry address");

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
        require(status == PoolStatus.ACTIVE, "Pool must be active");

        uint256 balance = address(this).balance;
        manager.depositRewards{value: balance}(id);
    }

    /**
     * @notice Withdraw balance from a pool to the manager
     * @param blamePercents The operator loss blame percents
     */
    function withdrawBalance(uint32[] memory blamePercents) external onlyOwner {
        require(status == PoolStatus.WITHDRAWN, "Pool must be withdrawn");

        uint256 balance = address(this).balance;
        int256 rewards = int256(balance) - int256(POOL_CAPACITY);
        if (rewards > 0) {
            manager.depositRewards{value: uint256(rewards)}(id);
        }
        for (uint256 i = 0; i < blamePercents.length; i++) {
            uint256 blameAmount;
            if (rewards < 0) {
                uint256 blamePercent = blamePercents[i];
                blameAmount = Math.mulDiv(uint256(-rewards), blamePercent, 100);
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
