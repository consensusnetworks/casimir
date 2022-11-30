// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.16;

import './SSVPool.sol';
import './interfaces/ISSVPool.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import '@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol';
import 'hardhat/console.sol';

/**
 * @title Manager contract that accepts and distributes deposits 
 */
contract SSVManager {
    /** Token abbreviation */
    enum Token {
        LINK,
        SSV,
        WETH
    }
    /** Token fees required for contract protocols */
    struct Fees {
        uint256 LINK;
        uint256 SSV;
    }
    /** User account for storing pool addresses */
    struct UserAccount {
        mapping (address => bool) poolAddressLookup;
        address[] poolAddresses;
    }
    /** Token addresses */
    mapping(Token => address) private tokens;
    /** All users who have deposited to pools */
    mapping (address => UserAccount) private users;
    /** Pools accepting deposits */
    address[] private openPools;
    /** Pools completed and staked */
    address[] private stakedPools;
    /** Event signaling a user deposit to a pool */
    event PoolDeposit(address userAddress, address poolAddress, uint256 depositAmount, uint256 depositTime);

    constructor(address linkTokenAddress, address ssvTokenAddress, address wethTokenAddress) {
        tokens[Token.LINK] = linkTokenAddress;
        tokens[Token.SSV] = ssvTokenAddress;
        tokens[Token.WETH] = wethTokenAddress;
    }

    /**
     * @notice Deposit to the pool manager
     */
    function deposit() external payable {
        address user = msg.sender;
        uint256 depositAmount = msg.value;
        uint256 time = block.timestamp;

        /// Distribute ETH to open pools
        (uint256 linkAmount, uint256 ssvAmount, uint256 stakeAmount) = processFees(depositAmount);

        console.log('LINK AMOUNT', linkAmount);
        console.log('SSV AMOUNT', ssvAmount);
        console.log('STAKE AMOUNT', stakeAmount);

        while (stakeAmount > 0) {
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
                            user, 
                            time, 
                            stakeAmount
                        )
                    )
                );
                /// Push new open pool
                openPools.push(poolAddress);
            }

            /// Get the pool contract
            ISSVPool poolContract = ISSVPool(poolAddress);

            /// Get contract amount for next open pool
            uint256 poolAmount = poolContract.getBalance();

            /// Deposit to pool
            uint256 poolRequiredAmount = 32000000000000000000 - poolAmount;
            uint256 newDepositAmount;
            if (poolRequiredAmount > stakeAmount) {
                newDepositAmount = stakeAmount;
                stakeAmount = 0;
            } else {
                newDepositAmount = poolRequiredAmount;
                stakeAmount -= poolRequiredAmount;
                /// Remove pool from open pools if completed
                for (uint i = 0; i < openPools.length - 1; i++) {
                    openPools[i] = openPools[i + 1];
                }
                openPools.pop();
                /// Add completed pool to staked pools
                stakedPools.push(poolAddress);
            }
            // Todo first transfer LINK and SSV to poolContract
            poolContract.deposit{ value: newDepositAmount }(user);

            /// Save pool address to user if new stake
            if (!users[user].poolAddressLookup[poolAddress]) {
                users[user].poolAddressLookup[poolAddress] = true;
                users[user].poolAddresses.push(poolAddress);
            }
            
            /// Emit pool deposit event
            emit PoolDeposit(user, poolAddress, newDepositAmount, time);
        }


    }

    /**
     * @dev Process fees from deposit
     * @return The remaining deposit amount after fees
     */
    function processFees(uint256 depositAmount) private returns (uint256, uint256, uint256) {
        Fees memory fees = getFees();
        uint feesTotal = fees.LINK + fees.SSV;
        uint256 stakeAmount = depositAmount * 100 / (100 + feesTotal);
        uint256 feeAmount = depositAmount - stakeAmount;

        /// Swap fees and return with { stakeAmount, linkAmount, ssvAmount }
        uint256 linkAmount = swap(tokens[Token.WETH], tokens[Token.LINK], feeAmount * fees.LINK / feesTotal);
        uint256 ssvAmount = swap(tokens[Token.WETH], tokens[Token.SSV], feeAmount * fees.SSV / feesTotal);

        return (linkAmount, ssvAmount, stakeAmount);
    }

    /**
     * @dev Swap one token for another
     * 
     */
    function swap(address tokenIn, address tokenOut, uint256 amountIn) private returns (uint256) {
        // Todo implement https://uniswap.org/blog/your-first-uniswap-integration
        uint256 amountOut = 0;
        return amountOut;
    }

    /**
     * @dev Deploy a new pool contract
     * @return The address of the newly deployed pool contract
     */
    function deployPool(bytes32 _salt) private returns (address) {
        return address(new SSVPool{salt: _salt}());
    }

    /**
     * @notice Get the current token fees as percentages
     * @return The current token fees as percentages
     */
    function getFees() public pure returns (Fees memory) {
        return Fees(getLINKFee(), getSSVFee());
    }

    /**
     * @notice Get the LINK fee percentage to charge on each deposit
     * @return The LINK fee percentage to charge on each deposit
     */
    function getLINKFee() public pure returns (uint) {
        return 1;
    }

    /**
     * @notice Get the SSV fee percentage to charge on each deposit
     * @return The SSV fee percentage to charge on each deposit
     */
    function getSSVFee() public pure returns (uint) {
        return 1;
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
        ISSVPool poolContract = ISSVPool(poolAddress);
        return poolContract.getUserBalance(userAddress);
    }

    /**
     * @notice Get the given pool's balance
     * @return The given pool's balance
     */ 
    function getBalanceForPool(address poolAddress) external view returns (uint256) {
        ISSVPool poolContract = ISSVPool(poolAddress);
        return poolContract.getBalance();
    }

}