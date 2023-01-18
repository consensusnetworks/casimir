// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./interfaces/IPoRAddressList.sol";
import "./interfaces/IWETH9.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "hardhat/console.sol";

/**
 * @title Manager contract that accepts and distributes deposits
 */
contract SSVManager is IPoRAddressList {
    using Counters for Counters.Counter;

    /**
     * Structs
     */

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
        uint32[] operatorIds;
        mapping(address => Balance) userBalances;
        string validatorPublicKey;
    }

    /** User account for storing pool addresses */
    struct User {
        mapping(uint32 => bool) poolIdLookup;
        uint32[] poolIds;
    }

    /** Validator data */
    struct Validator {
        uint32[] operatorIds;
        string validatorPublicKey;
        uint32 currentPoolId;
        bool deposited;
    }

    /**
     * Storage
     */

    /** Pool ID generator */
    Counters.Counter _lastPoolId;

    /** Uniswap 0.3% fee tier */
    uint24 private immutable swapFee = 3000;

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

    /** Pool IDs of pools ready to be staked */
    uint32[] private readyPoolIds;

    /** Pool IDs of staked pools */
    uint32[] private stakedPoolIds;

    /** Chainlink oracle contract address */
    address private oracleAddress;

    /** Chainlink rewards feed aggregator */
    AggregatorV3Interface internal rewardsFeed;

    /** Validators */
    mapping(address => Validator) private validators;

    /** Validator addresses */
    address[] private validatorAddresses;

    /** Open validator addresses */
    address[] private openValidatorAddresses;

    /**
     * Events
     */

    /** Event signaling a validator init request fulfillment */
    event ValidatorInitialized(
        uint32 poolId,
        uint32[] operatorIds,
        string validatorPublicKey
    );

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

    /**
     * @notice Constructor
     * @param _linkOracleAddress - The Chainlink oracle address
     * @param _swapRouterAddress - The Uniswap router address
     * @param _linkTokenAddress - The Chainlink token address
     * @param _ssvTokenAddress - The SSV token address
     * @param _wethTokenAddress - The WETH contract address
     */
    constructor(
        address _linkOracleAddress,
        address _swapRouterAddress,
        address _linkTokenAddress,
        address _ssvTokenAddress,
        address _wethTokenAddress
    ) {
        swapRouter = ISwapRouter(_swapRouterAddress);
        tokens[Token.LINK] = _linkTokenAddress;
        tokens[Token.SSV] = _ssvTokenAddress;
        tokens[Token.WETH] = _wethTokenAddress;

        /// Set up Chainlink rewards feed aggregator
        rewardsFeed = AggregatorV3Interface(_linkOracleAddress);
    }

    /**
     * @notice Deposit to the pool manager
     */
    function deposit() external payable {

        // Todo exit if openValidatorAddresses.length is 0

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

                /// Remove pool from open pools when ready
                for (uint i = 0; i < openPoolIds.length - 1; i++) {
                    openPoolIds[i] = openPoolIds[i + 1];
                }
                openPoolIds.pop();

                /// Start a new validator to stake pool
                depositValidator(poolId);

                /// Add completed pool to staked pools
                stakedPoolIds.push(poolId);
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
     * @param _depositAmount - The deposit amount
     * @return The fee and stake deposit amounts
     */
    function processDepositFunds(
        uint256 _depositAmount
    ) private returns (DepositFunds memory) {
        Fees memory fees = getFees();
        uint32 feesTotal = fees.LINK + fees.SSV;
        uint256 stakeAmount = (_depositAmount * 100) / (100 + feesTotal);
        uint256 feeAmount = _depositAmount - stakeAmount;

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
     * @param _amount - The amount of ETH to deposit
     */
    function wrap(uint256 _amount) private {
        IWETH9 wethToken = IWETH9(tokens[Token.WETH]);
        wethToken.deposit{value: _amount}();
        wethToken.approve(address(swapRouter), _amount);
    }

    /**
     * @dev Swap one token-in for another token-out
     * @param _tokenIn - The token-in address
     * @param _tokenOut - The token-out address
     * @param _amountIn - The amount of token-in to input
     * @return The amount of token-out
     */
    function swap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn
    ) private returns (uint256) {
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: _tokenIn,
                tokenOut: _tokenOut,
                fee: swapFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: _amountIn,
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

    /**
     * @dev Init a validator for a pool
     */
    function depositValidator(uint32 _poolId) private {

        // Todo exit if openValidatorAddresses.length is 0

        address validatorAddress = openValidatorAddresses[0];
        Validator memory validator = validators[validatorAddress];
        /// Update the pool with validator init data
        Pool storage pool = pools[_poolId];
        pool.operatorIds = validator.operatorIds;
        pool.validatorPublicKey = validator.validatorPublicKey;

        /// Register the pool validator and deposit
        stakePool(_poolId);

        emit ValidatorInitialized(
            _poolId,
            pool.operatorIds,
            pool.validatorPublicKey
        );
    }

    /**
     * @notice Stakes a pool
     *
     * @param _poolId - the stake pool's ID
     */
    function stakePool(uint32 _poolId) private view {
        Pool storage pool = pools[_poolId];
        console.log(
            "Staking pool",
            _poolId,
            "to validator",
            pool.validatorPublicKey
        );

        // beaconDepositor.deposit{ value: pool.balance.stake }(
        //     pool.validatorPublicKey, // bytes
        //     address(this), // bytes
        //     signature, // bytes
        //     depositData // bytes32
        // );
    }

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
     * @param _userAddress - The user address
     * @return A list of a user's pool IDs
     */
    function getUserPoolIds(
        address _userAddress
    ) external view returns (uint32[] memory) {
        return users[_userAddress].poolIds;
    }

    /**
     * @notice Get a user's balance in a pool by user address and pool ID
     * @param _poolId - The pool ID
     * @param _userAddress - The user address
     * @return A user's balance in a pool
     */
    function getPoolUserBalance(
        uint32 _poolId,
        address _userAddress
    ) external view returns (Balance memory) {
        return pools[_poolId].userBalances[_userAddress];
    }

    /**
     * @notice Get a pool's balance by pool ID
     * @param _poolId - The pool ID
     * @return The pool's balance
     */
    function getPoolBalance(
        uint32 _poolId
    ) external view returns (Balance memory) {
        return pools[_poolId].balance;
    }

    /**
     * @notice Get a pool's validator public key by pool ID
     * @param _poolId - The pool ID
     * @return The pool's validator public key
     */
    function getPoolValidatorPublicKey(
        uint32 _poolId
    ) external view returns (string memory) {
        return pools[_poolId].validatorPublicKey;
    }

    /**
     * @notice Get a pool's operators by pool ID
     * @param _poolId - The pool ID
     * @return The pool's operators
     */
    function getPoolOperatorIds(
        uint32 _poolId
    ) external view returns (uint32[] memory) {
        return pools[_poolId].operatorIds;
    }

    /**
     * @notice Get the latest total rewards (PoR)
     * @return The latest rewards
     */
    function getLatestRewards() public view returns (int) {
        // prettier-ignore
        (
            /*uint80 roundID*/,
            int rewards,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = rewardsFeed.latestRoundData();

        return rewards;
    }

    function getPoRAddressListLength()
        external
        view
        override
        returns (uint256)
    {
        return validatorAddresses.length;
    }

    function getPoRAddressList(
        uint256 startIndex,
        uint256 endIndex
    ) external view override returns (string[] memory) {
        if (startIndex > endIndex) {
            return new string[](0);
        }
        endIndex = endIndex > validatorAddresses.length - 1
            ? validatorAddresses.length - 1
            : endIndex;
        string[] memory stringAddresses = new string[](
            endIndex - startIndex + 1
        );
        uint256 currIdx = startIndex;
        uint256 strAddrIdx = 0;
        while (currIdx <= endIndex) {
            stringAddresses[strAddrIdx] = toString(
                abi.encodePacked(validatorAddresses[currIdx])
            );
            strAddrIdx++;
            currIdx++;
        }
        return stringAddresses;
    }

    function toString(bytes memory data) private pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint256(uint8(data[i] >> 4))];
            str[3 + i * 2] = alphabet[uint256(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }
}
