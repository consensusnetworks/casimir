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

    uint256 poolCapacity = 32 ether;
    ICasimirManager private immutable manager;
    ICasimirRegistry private immutable registry;
    PoolConfig private config;

    constructor(
        address registryAddress,
        uint32 poolId,
        bytes memory publicKey,
        uint64[] memory operatorIds
    ) {
        manager = ICasimirManager(msg.sender);
        registry = ICasimirRegistry(registryAddress);
        config.poolId = poolId;
        config.publicKey = publicKey;
        config.operatorIds = operatorIds;
    }

    function depositRewards() external onlyOwner {
        uint256 balance = address(this).balance;
        manager.depositRewards{value: balance}();
    }

    function withdrawBalance(uint32[] memory blamePercents) external onlyOwner {
        require(config.status == PoolStatus.WITHDRAWN, "Pool must be withdrawn");

        uint256 balance = address(this).balance;
        uint256 rewards = poolCapacity - balance;
        if (rewards > 0) {
            manager.depositRewards{value: rewards}();
        }
        uint256 exitedBalance = balance - rewards;
        uint256 lostBalance = poolCapacity - exitedBalance;
        for (uint256 i = 0; i < blamePercents.length; i++) {
            uint256 blameAmount;
            if (lostBalance > 0) {
                uint256 blamePercent = blamePercents[i];
                blameAmount = Math.mulDiv(lostBalance, blamePercent, 100);
            }
            registry.removeActivePool(config.poolId, config.operatorIds[i], blameAmount);
        }

        manager.depositExitedBalance{value: balance}(config.poolId);
    }

    function setOperatorIds(uint64[] memory operatorIds) external onlyOwner {
        config.operatorIds = operatorIds;
    }

    function setStatus(PoolStatus status) external onlyOwner {
        config.status = status;        
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getConfig() external view override returns (PoolConfig memory) {
        return config;
    }

    function getOperatorIds() external view returns (uint64[] memory) {
        return config.operatorIds;
    }

    function getPublicKey() external view returns (bytes memory) {
        return config.publicKey;
    }

    function getStatus() external view returns (PoolStatus) {
        return config.status;
    }
}