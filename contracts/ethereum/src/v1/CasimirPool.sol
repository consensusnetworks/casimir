// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './interfaces/ICasimirPool.sol';
import './interfaces/ICasimirManager.sol';
import './interfaces/ICasimirRegistry.sol';
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Dev-only imports
import "hardhat/console.sol";

/**
 * @title Pool contract that accepts deposits and stakes a validator
 */
contract CasimirPool is ICasimirPool, Ownable, ReentrancyGuard {
    /*************/
    /* Constants */
    /*************/

    /** Pool capacity */
    uint256 poolCapacity = 32 ether;

    /*************/
    /* Immutable */
    /*************/

    /** Manager contract */
    ICasimirManager private immutable manager;
    /** Registry contract */
    ICasimirRegistry private immutable registry;

    /*********/
    /* State */
    /*********/

    /** Pool ID */
    uint32 public id;
    /** Validator public key */
    bytes public publicKey;
    /** Operator IDs */
    uint64[] private operatorIds;
    /** Reshares */
    uint256 public reshares;
    /** Status */
    PoolStatus public status;

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
        uint256 balance = address(this).balance;
        manager.depositRewards{value: balance}();
    }

    /**
     * @notice Withdraw balance from a pool to the manager
     * @param blamePercents The operator loss blame percents
     */
    function withdrawBalance(uint32[] memory blamePercents) external onlyOwner {
        require(status == PoolStatus.WITHDRAWN, "Pool must be withdrawn");

        uint256 balance = address(this).balance;
        int256 rewards = int256(balance) - int256(poolCapacity);
        if (rewards > 0) {
            manager.depositRewards{value: uint256(rewards)}();
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
    }

    /**
     * @notice Set the reshare count
     * @param _reshares The reshare count
     */
    function setReshares(uint256 _reshares) external onlyOwner {
        reshares = _reshares;
    }

    /**
     * @notice Set the pool status
     * @param _status The pool status
     */
    function setStatus(PoolStatus _status) external onlyOwner {
        status = _status;        
    }

    /**
     * @notice Get the pool details
     * @return poolDetails The pool details
     */
    function getDetails() external view returns (PoolDetails memory poolDetails) {
        poolDetails = PoolDetails({
            id: id,
            balance: address(this).balance,
            publicKey: publicKey,
            operatorIds: operatorIds,
            reshares: reshares,
            status: status
        });
    }

    /**
     * @notice Get the pool balance
     * @return balance The pool balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get the operator IDs
     * @return operatorIds The operator IDs
     */
    function getOperatorIds() external view returns (uint64[] memory) {
        return operatorIds;
    }
}