// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.16;

import './SSVPool.sol';
import './interfaces/ISSVPool.sol';
import './interfaces/IWETH9.sol';
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import 'hardhat/console.sol';

/**
 * @title Manager contract that accepts and distributes deposits 
 */
contract SSVManager {
    /** Uniswap 0.3% fee tier */
    uint24 swapFee = 3000;
    /** Uniswap ISwapRouter */    
    ISwapRouter public immutable swapRouter;
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
    /** Event signaling a user deposit to the manager */
    event ManagerDeposit(address userAddress, uint256 depositAmount, uint256 depositTime);
    /** Event signaling a user stake to a pool */
    event PoolStake(address userAddress, address poolAddress, uint256 linkAmount, uint256 ssvAmount, uint256 stakeAmount, uint256 stakeTime);

    constructor(address swapRouterAddress, address linkTokenAddress, address ssvTokenAddress, address wethTokenAddress) {
        swapRouter = ISwapRouter(swapRouterAddress);
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

        /// Emit manager deposit event
        emit ManagerDeposit(user, depositAmount, time);

        /// Distribute ETH stake with LINK and SSV fees to open pools
        (uint256 linkAmount, uint256 ssvAmount, uint256 stakeAmount) = processFees(depositAmount);

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
            uint256 newStakeAmount;
            if (poolRequiredAmount > stakeAmount) {
                newStakeAmount = stakeAmount;
                stakeAmount = 0;
            } else {
                newStakeAmount = poolRequiredAmount;
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
            poolContract.deposit{ value: newStakeAmount }(user);

            /// Save pool address to user if new stake
            if (!users[user].poolAddressLookup[poolAddress]) {
                users[user].poolAddressLookup[poolAddress] = true;
                users[user].poolAddresses.push(poolAddress);
            }
            
            /// Emit pool stake event
            emit PoolStake(user, poolAddress, linkAmount, ssvAmount, stakeAmount, time);
        }


    }

    /**
     * @dev Process fees from deposit
     * @return The LINK and SSV fee amounts, and remaining stake amount after fees
     */
    function processFees(uint256 depositAmount) private returns (uint256, uint256, uint256) {
        Fees memory fees = getFees();
        uint feesTotal = fees.LINK + fees.SSV;
        uint256 stakeAmount = depositAmount * 100 / (100 + feesTotal);
        uint256 feeAmount = depositAmount - stakeAmount;

        /// Wrap ETH fees in ERC-20 to use in swap
        depositWETH(feeAmount);

        /// Swap fees and return with { stakeAmount, linkAmount, ssvAmount }
        uint256 linkAmount = swap(tokens[Token.WETH], tokens[Token.LINK], feeAmount * fees.LINK / feesTotal);
        uint256 ssvAmount = swap(tokens[Token.WETH], tokens[Token.SSV], feeAmount * fees.SSV / feesTotal);

        return (linkAmount, ssvAmount, stakeAmount);
    }

    /**
     * @dev Deposit WETH to use ETH in swaps
     */
    function depositWETH(uint256 amount) private {
        IWETH9 wethToken = IWETH9(tokens[Token.WETH]);
        wethToken.deposit{ value: amount }();
        wethToken.approve(address(swapRouter), amount);
    }

    /**
     * @dev Swap one token-in for another token-out
     * @return The amount of token-out
     */
    function swap(address tokenIn, address tokenOut, uint256 amountIn) private returns (uint256) {
        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: swapFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        /// The call to `exactInputSingle` executes the swap
        return swapRouter.exactInputSingle(params);
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