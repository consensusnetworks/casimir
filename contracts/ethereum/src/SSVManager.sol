// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.16;

import './interfaces/IWETH9.sol';
import "@openzeppelin/contracts/utils/Counters.sol";
import '@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol';
import 'hardhat/console.sol';

/**
 * @title Manager contract that accepts and distributes deposits 
 */
contract SSVManager {    
    using Counters for Counters.Counter;

    /** Pool ID generator */
    Counters.Counter _lastPoolId;
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
    /** User balance for storing user stake and reward amounts */
    struct Balance {
        uint256 stake;
        uint256 rewards;
    }
    /** SSV pool used for running a validator */
    struct Pool {
        Balance balance;
        mapping (address => Balance) userBalances;

    }
    /** User account for storing pool addresses */
    struct User {
        mapping (uint256 => bool) poolIdLookup;
        uint256[] poolIds;
    }
    /** Token addresses */
    mapping(Token => address) private tokens;
    /** All users who have deposited to pools */
    mapping (address => User) private users;
    /** SSV pools */
    mapping(uint256 => Pool) private pools;
    /** Pool IDs of pools accepting deposits */
    uint256[] private openPoolIds;
    /** Pool IDs of pools completed and staked */
    uint256[] private stakedPoolIds;
    /** Event signaling a user deposit to the manager */
    event ManagerDeposit(address userAddress, uint256 depositAmount, uint256 depositTime);
    /** Event signaling a user stake to a pool */
    event PoolStake(address userAddress, uint256 poolId, uint256 linkAmount, uint256 ssvAmount, uint256 stakeAmount, uint256 stakeTime);

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
            /// Get next open pool
            uint256 poolId;
            Pool storage pool;
            if (openPoolIds.length > 0) {
                poolId = openPoolIds[0];
            } else {
                /// Generate a new pool ID
                _lastPoolId.increment();
                poolId = _lastPoolId.current();

                /// Push new open pool ID
                openPoolIds.push(poolId);
            }

            /// Get the pool
            pool = pools[poolId];

            /// Get contract amount for next open pool
            uint256 poolStakeAmount = pool.balance.stake;

            /// Deposit to pool
            uint256 poolRequiredAmount = 32000000000000000000 - poolStakeAmount;
            uint256 userStakeAmount;
            if (poolRequiredAmount > stakeAmount) {
                userStakeAmount = stakeAmount;
                stakeAmount = 0;
            } else {
                userStakeAmount = poolRequiredAmount;
                stakeAmount -= poolRequiredAmount;
                /// Remove pool from open pools if completed
                for (uint i = 0; i < openPoolIds.length - 1; i++) {
                    openPoolIds[i] = openPoolIds[i + 1];
                }

                openPoolIds.pop();
                /// Add completed pool to staked pools
                stakedPoolIds.push(poolId);
            }
            // Todo first transfer LINK and SSV to pool
            pool.balance.stake += userStakeAmount;
            pool.userBalances[user].stake += userStakeAmount;

            /// Save pool address to user if new stake
            if (!users[user].poolIdLookup[poolId]) {
                users[user].poolIdLookup[poolId] = true;
                users[user].poolIds.push(poolId);
            }
            
            /// Emit pool stake event
            emit PoolStake(user, poolId, linkAmount, ssvAmount, stakeAmount, time);
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
        wrap(feeAmount);

        /// Swap fees and return with { stakeAmount, linkAmount, ssvAmount }
        uint256 linkAmount = swap(tokens[Token.WETH], tokens[Token.LINK], feeAmount * fees.LINK / feesTotal);
        uint256 ssvAmount = swap(tokens[Token.WETH], tokens[Token.SSV], feeAmount * fees.SSV / feesTotal);

        return (linkAmount, ssvAmount, stakeAmount);
    }

    /**
     * @dev Deposit WETH to use ETH in swaps
     */
    function wrap(uint256 amount) private {
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
     * @notice Get all open pool IDs
     * @return An array of all open pool IDs
     */ 
    function getOpenPoolIds() external view returns (uint256[] memory) {
        return openPoolIds;
    }

    /**
     * @notice Get all the staked pool IDs
     * @return An array of all the staked pool IDs
     */ 
    function getStakedPoolIds() external view returns (uint256[] memory) {
        return stakedPoolIds;
    }

    /**
     * @notice Get the pools for a given user
     * @return An array of pools for a given user
     */ 
    function getPoolsForUser(address userAddress) external view returns (uint256[] memory) {
        return users[userAddress].poolIds;
    }

    /**
     * @notice Get a pool user balance by pool ID
     * @return The pool user balance
     */ 
    function getPoolUserBalance(address userAddress, uint256 poolId) external view returns (Balance memory) {
        return pools[poolId].userBalances[userAddress];
    }

    /**
     * @notice Get a pool balance by pool ID
     * @return The pool balance
     */ 
    function getPoolBalance(uint256 poolId) external view returns (Balance memory) {
        return pools[poolId].balance;
    }

}