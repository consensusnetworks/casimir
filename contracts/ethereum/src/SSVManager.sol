// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.16;

import "./interfaces/IWETH9.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "hardhat/console.sol";

/**
 * @title Manager contract that accepts and distributes deposits
 */
contract SSVManager is ChainlinkClient {
    using Chainlink for Chainlink.Request;
    using Counters for Counters.Counter;

    /** Token abbreviations */
    enum Token {
        LINK,
        SSV,
        WETH
    }

    /** Balance for storing stake and reward amounts */
    struct Balance {
        uint256 stake;
        uint256 rewards;
    }

    /** Processed fee and stake amounts */
    struct DepositFunds {
        uint256 linkAmount;
        uint256 ssvAmount;
        uint256 stakeAmount;
    }

    /** Token fees required for contract protocols */
    struct Fees {
        uint32 LINK;
        uint32 SSV;
    }

    /** SSV pool used for running a validator */
    struct Pool {
        Balance balance;
        mapping(address => Balance) userBalances;
    }

    /** User account for storing pool addresses */
    struct User {
        mapping(uint32 => bool) poolIdLookup;
        uint32[] poolIds;
    }

    /** Pool ID generator */
    Counters.Counter _lastPoolId;

    /** Uniswap 0.3% fee tier */
    uint24 swapFee = 3000;

    /** Uniswap ISwapRouter */
    ISwapRouter public immutable swapRouter;

    /** Token addresses */
    mapping(Token => address) private tokens;

    /** All users who have deposited to pools */
    mapping(address => User) private users;

    /** SSV pools */
    mapping(uint32 => Pool) private pools;

    /** Pool IDs of pools accepting deposits */
    uint32[] private openPoolIds;

    /** Pool IDs of pools completed and staked */
    uint32[] private stakedPoolIds;

    /** Chainlink sample request data */
    uint256 public data;

    /** Chainlink sample request job ID */
    bytes32 private immutable jobId;

    /** Chainlink sample request fee */
    uint256 private immutable fee;

    address private oracleAddress;

    /** Chainlink sample request */
    event ValidatorInitFullfilled(uint256 data);

    /** Event signaling a user deposit to the manager */
    event ManagerDeposit(
        address userAddress,
        uint256 linkAmount,
        uint256 ssvAmount,
        uint256 stakeAmount,
        uint256 depositTime
    );

    /** Event signaling a user stake to a pool */
    event PoolStake(
        address userAddress,
        uint32 poolId,
        uint256 linkAmount,
        uint256 ssvAmount,
        uint256 stakeAmount,
        uint256 stakeTime
    );

    constructor(
        address linkOracleAddress,
        address swapRouterAddress,
        address linkTokenAddress,
        address ssvTokenAddress,
        address wethTokenAddress
    ) {
        swapRouter = ISwapRouter(swapRouterAddress);
        tokens[Token.LINK] = linkTokenAddress;
        tokens[Token.SSV] = ssvTokenAddress;
        tokens[Token.WETH] = wethTokenAddress;

        /// Set up Chainlink client
        setChainlinkOracle(linkOracleAddress);
        setChainlinkToken(linkTokenAddress);
        jobId = '7da2702f37fd48e5b1b9a5715e3509b6';
        fee = (1 * LINK_DIVISIBILITY) / 10;
    }

    /**
     * @notice Deposit to the pool manager
     */
    function deposit() external payable {
        address userAddress = msg.sender;
        uint256 depositAmount = msg.value;
        uint256 time = block.timestamp;

        /// Swap fees to protocol token funds
        DepositFunds memory depositFunds = processDepositFunds(depositAmount);

        /// Emit manager deposit event
        emit ManagerDeposit(
            userAddress,
            depositFunds.linkAmount,
            depositFunds.ssvAmount,
            depositFunds.stakeAmount,
            time
        );

        /// Distribute ETH stake to pools
        while (depositFunds.stakeAmount > 0) {
            /// Get next open pool
            uint32 poolId;
            Pool storage pool;
            if (openPoolIds.length > 0) {
                poolId = openPoolIds[0];
            } else {
                /// Generate a new pool ID
                _lastPoolId.increment();
                poolId = uint32(_lastPoolId.current());

                /// Push new open pool ID
                openPoolIds.push(poolId);
            }

            /// Get the pool
            pool = pools[poolId];

            /// Get contract amount for next open pool
            uint256 poolStakeAmount = pool.balance.stake;

            /// Deposit to pool
            uint256 poolRequiredAmount = 32000000000000000000 - poolStakeAmount;
            uint256 addStakeAmount;
            if (poolRequiredAmount > depositFunds.stakeAmount) {
                // Deposit remaining stake amount
                addStakeAmount = depositFunds.stakeAmount;
                depositFunds.stakeAmount = 0;
            } else {
                addStakeAmount = poolRequiredAmount;
                depositFunds.stakeAmount -= poolRequiredAmount;

                /// Remove pool from open pools when completed
                for (uint i = 0; i < openPoolIds.length - 1; i++) {
                    openPoolIds[i] = openPoolIds[i + 1];
                }
                openPoolIds.pop();
                /// Add completed pool to staked pools
                stakedPoolIds.push(poolId);

                // stake();
            }

            pool.balance.stake += addStakeAmount;
            pool.userBalances[userAddress].stake += addStakeAmount;

            /// Save pool address to user if new stake
            User storage user = users[userAddress];
            if (!user.poolIdLookup[poolId]) {
                user.poolIdLookup[poolId] = true;
                user.poolIds.push(poolId);
            }

            /// Emit pool stake event
            emit PoolStake(
                userAddress,
                poolId,
                depositFunds.linkAmount,
                depositFunds.ssvAmount,
                depositFunds.stakeAmount,
                time
            );
        }
    }

    /**
     * @dev Process fee and stake deposit amounts
     * @return The fee and stake deposit amounts
     */
    function processDepositFunds(
        uint256 depositAmount
    ) private returns (DepositFunds memory) {
        Fees memory fees = getFees();
        uint32 feesTotal = fees.LINK + fees.SSV;
        uint256 stakeAmount = (depositAmount * 100) / (100 + feesTotal);
        uint256 feeAmount = depositAmount - stakeAmount;

        // /// Wrap ETH fees in ERC-20 to use in swap
        wrap(feeAmount);

        /// Swap fees and return with { stakeAmount, linkAmount, ssvAmount }
        uint256 linkAmount = swap(
            tokens[Token.WETH],
            tokens[Token.LINK],
            (feeAmount * fees.LINK) / feesTotal
        );
        uint256 ssvAmount = swap(
            tokens[Token.WETH],
            tokens[Token.SSV],
            (feeAmount * fees.SSV) / feesTotal
        );

        return DepositFunds(linkAmount, ssvAmount, stakeAmount);
    }

    /**
     * @dev Deposit WETH to use ETH in swaps
     */
    function wrap(uint256 amount) private {
        IWETH9 wethToken = IWETH9(tokens[Token.WETH]);
        wethToken.deposit{value: amount}();
        wethToken.approve(address(swapRouter), amount);
    }

    /**
     * @dev Swap one token-in for another token-out
     * @return The amount of token-out
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) private returns (uint256) {
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
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
    function getLINKFee() public pure returns (uint32) {
        return 1;
    }

    /**
     * @notice Get the SSV fee percentage to charge on each deposit
     * @return The SSV fee percentage to charge on each deposit
     */
    function getSSVFee() public pure returns (uint32) {
        return 1;
    }

    // function stake() private {
    //     this.requestValidatorInit();
    // }

    /**
     *
     */

    /**
     * @notice Creates a Chainlink request to retrieve API response, find the target
     * data, then multiply by 1000000000000000000 (to remove decimal places from data).
     *
     * @return requestId - id of the request
     */
    function requestValidatorInit() public returns (bytes32 requestId) {
        Chainlink.Request memory request = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfillValidatorInit.selector
        );

        // Set the URL to perform the GET request on
        request.add(
            "get",
            "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ETH&tsyms=USD"
        );

        // Set the path to find the desired data in the API response, where the response format is:
        // {"RAW":
        //   {"ETH":
        //    {"USD":
        //     {
        //      "VOLUME24HOUR": xxx.xxx,
        //     }
        //    }
        //   }
        //  }
        // request.add("path", "RAW.ETH.USD.VOLUME24HOUR"); // Chainlink nodes prior to 1.0.0 support this format
        request.add("path", "RAW,ETH,USD,VOLUME24HOUR"); // Chainlink nodes 1.0.0 and later support this format

        // Multiply the result by 1000000000000000000 to remove decimals
        int256 timesAmount = 10 ** 18;
        request.addInt("times", timesAmount);

        // Sends the request
        return sendChainlinkRequest(request, fee);
    }

    /**
     * @notice Receives the response in the form of uint256
     *
     * @param _requestId - id of the request
     * @param _data - response
     */
    function fulfillValidatorInit(bytes32 _requestId, uint256 _data)
        public
        recordChainlinkFulfillment(_requestId)
    {
        data = _data;
        emit ValidatorInitFullfilled(data);
    }

    /**
     *
     */

    /**
     * @notice Get a list of all open pool IDs
     * @return A list of all open pool IDs
     */
    function getOpenPoolIds() external view returns (uint32[] memory) {
        return openPoolIds;
    }

    /**
     * @notice Get a list of all staked pool IDs
     * @return A list of all staked pool IDs
     */
    function getStakedPoolIds() external view returns (uint32[] memory) {
        return stakedPoolIds;
    }

    /**
     * @notice Get a list of a user's pool IDs by user address
     * @return A list of a user's pool IDs
     */
    function getUserPoolIds(
        address userAddress
    ) external view returns (uint32[] memory) {
        return users[userAddress].poolIds;
    }

    /**
     * @notice Get a user's balance in a pool by user address and pool ID
     * @return A user's balance in a pool
     */
    function getPoolUserBalance(
        uint32 poolId,
        address userAddress
    ) external view returns (Balance memory) {
        return pools[poolId].userBalances[userAddress];
    }

    /**
     * @notice Get a pool's balance by pool ID
     * @return The pool's balance
     */
    function getPoolBalance(
        uint32 poolId
    ) external view returns (Balance memory) {
        return pools[poolId].balance;
    }
}
