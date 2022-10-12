// SPDX-License-Identifier: Unlicense
pragma solidity 0.8.17;

import './SSVPool.sol';
import './interfaces/SSVPoolInterface.sol';

/**
 * @title Manager contract that accepts and distributes deposits 
 */
contract SSVManager {

    /** User account struct for storing pool addresses */
    struct UserAccount {
        mapping (address => bool) poolAddressLookup;
        address[] poolAddresses;
    }
    /** All users who have deposited to pools */
    mapping (address => UserAccount) private users;
    /** Pools accepting deposits */
    address[] private openPools;
    /** Pools completed and staked */
    address[] private stakedPools;
    /** Event signaling a user deposit to a pool */
    event PoolDeposit(address userAddress, address poolAddress, uint256 depositAmount, uint256 depositTime);

    constructor() {}

    /**
     * @notice Deposit to the pool manager
     */
    function deposit() external payable {

        /// Distribute ETH to open pools
        uint256 availableDepositAmount = msg.value;
        while (availableDepositAmount > 0) {
            /// Get contract address for next open pool
            address poolAddress;
            if (openPools.length > 0) {
                poolAddress = openPools[0];
            } else {
                /// Deploy new contract
                poolAddress = deployPool(
                    /// Include unique salt
                    keccak256(
                        abi.encodePacked(
                            msg.sender, 
                            block.timestamp, 
                            availableDepositAmount
                        )
                    )
                );
                /// Push new open pool
                openPools.push(poolAddress);
            }

            /// Get the pool contract
            SSVPoolInterface poolContract = SSVPoolInterface(poolAddress);

            /// Get contract amount for next open pool
            uint256 poolAmount = poolContract.getBalance();

            /// Deposit to pool
            uint256 currentNeededAmount = 32000000000000000000 - poolAmount;
            uint256 newDepositAmount;
            if (currentNeededAmount > availableDepositAmount) {
                newDepositAmount = availableDepositAmount;
                availableDepositAmount = 0;
            } else {
                newDepositAmount = currentNeededAmount;
                availableDepositAmount -= currentNeededAmount;
                /// Remove pool from open pools if completed
                for (uint i = 0; i < openPools.length - 1; i++) {
                    openPools[i] = openPools[i + 1];
                }
                openPools.pop();
                /// Add completed pool to staked pools
                stakedPools.push(poolAddress);
            }
            poolContract.deposit{ value: newDepositAmount }(msg.sender);

            /// Save pool address to user if new stake
            if (!users[msg.sender].poolAddressLookup[poolAddress]) {
                users[msg.sender].poolAddressLookup[poolAddress] = true;
                users[msg.sender].poolAddresses.push(poolAddress);
            }
            
            /// Emit pool deposit event
            emit PoolDeposit(msg.sender, poolAddress, newDepositAmount, block.timestamp);
        }


    }

    /**
     * @dev Deploys a new pool contract
     * @return The address of the newly deployed pool contract
     */
    function deployPool(bytes32 _salt) private returns (address) {
        return address(new SSVPool{salt: _salt}());
    }

    /**
     * @notice Get all open pools
     * @return An array of all open pools
     */ 
    function getOpenPools() external view returns (address[] memory) {
        return openPools;
    }

    /**
     * @notice Get all the staked pools
     * @return An array of all the staked pools
     */ 
    function getStakedPools() external view returns (address[] memory) {
        return stakedPools;
    }

    /**
     * @notice Get the pools for a given user
     * @return An array of pools for a given user
     */ 
    function getPoolsForUser(address userAddress) external view returns (address[] memory) {
        return users[userAddress].poolAddresses;
    }

    /**
     * @notice Get the given user's balance for the given pool
     * @return The given user's balance for the given pool
     */ 
    function getUserBalanceForPool(address userAddress, address poolAddress) external view returns (uint256) {
        SSVPoolInterface poolContract = SSVPoolInterface(poolAddress);
        return poolContract.getUserBalance(userAddress);
    }

    /**
     * @notice Get the given pool's balance
     * @return The given pool's balance
     */ 
    function getBalanceForPool(address poolAddress) external view returns (uint256) {
        SSVPoolInterface poolContract = SSVPoolInterface(poolAddress);
        return poolContract.getBalance();
    }

}