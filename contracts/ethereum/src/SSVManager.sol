// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./interfaces/IDepositContract.sol";
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
    /// Use counter for incrementing IDs
    using Counters for Counters.Counter;

    /***** Structs *****/

    /** Rewards and stake balance */
    struct Balance {
        uint256 rewards;
        uint256 stake;
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
        uint256 depositAmount;
        uint32[] operatorIds;
        mapping(address => uint256) userStakes;
        bytes validatorPublicKey;
    }
    /** SSV pool details for a user */
    struct PoolUserDetails {
        Balance balance;
        Balance userBalance;
    }
    /** Token abbreviations */
    enum Token {
        LINK,
        SSV,
        WETH
    }
    /** User account for storing pool addresses */
    struct User {
        mapping(uint32 => bool) poolIdLookup;
        uint32[] poolIds;
    }
    /** Validator data */
    struct Validator {
        bytes32 depositData;
        bytes[] encryptedShares;
        uint32[] operatorIds;
        bytes signature;
        bytes validatorPublicKey;
    }

    /***** Storage *****/

    /** Beacon deposit contract */
    IDepositContract private immutable beaconDeposit;
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
    /** Pool IDs of staked pools */
    uint32[] private stakedPoolIds;
    /** Chainlink rewards feed aggregator */
    AggregatorV3Interface internal balanceFeed;
    /** Validators (inactive and active) */
    mapping(address => Validator) private validators;
    /** Inactive validator public keys */
    address[] private inactiveValidatorAddresses;
    /** Active validator public keys */
    address[] private activeValidatorAddresses;

    /***** Events *****/

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
    /** Event signaling a validator activation */
    event ValidatorActivated(
        uint32 poolId,
        uint32[] operatorIds,
        bytes validatorPublicKey
    );
    /** Event signaling a validator registration */
    event ValidatorRegistered(
        uint32[] operatorIds,
        bytes validatorPublicKey
    );
    
    /**
     * @notice Constructor
     * @param _depositAddress – The Beacon deposit address
     * @param _linkOracleAddress - The Chainlink data feed address
     * @param _linkTokenAddress - The Chainlink token address
     * @param _ssvTokenAddress - The SSV token address
     * @param _swapRouterAddress - The Uniswap router address
     * @param _wethTokenAddress - The WETH contract address
     */
    constructor(
        address _depositAddress,
        address _linkOracleAddress,
        address _linkTokenAddress,
        address _ssvTokenAddress,
        address _swapRouterAddress,
        address _wethTokenAddress
    ) {
        beaconDeposit = IDepositContract(_depositAddress);
        balanceFeed = AggregatorV3Interface(_linkOracleAddress);
        tokens[Token.LINK] = _linkTokenAddress;
        tokens[Token.SSV] = _ssvTokenAddress;
        swapRouter = ISwapRouter(_swapRouterAddress);
        tokens[Token.WETH] = _wethTokenAddress;
    }

    /**
     * @notice Deposit to the pool manager
     */
    function deposit() external payable {
        require(inactiveValidatorAddresses.length > 0, "no validators ready");

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
            Pool storage pool;
            pool = pools[poolId];

            /// Get contract amount for next open pool
            uint256 poolDepositedAmount = pool.depositAmount;

            /// Deposit to pool
            uint256 poolRequiredAmount = 32000000000000000000 - poolDepositedAmount;
            uint256 newDepositAmount;
            if (poolRequiredAmount > depositFunds.stakeAmount) {

                /// Set pool stake amount to total available
                newDepositAmount = depositFunds.stakeAmount;
                depositFunds.stakeAmount = 0;

            } else {
                
                /// Set pool stake amount to total required
                newDepositAmount = poolRequiredAmount;
                depositFunds.stakeAmount -= poolRequiredAmount;

                /// Start a new validator to stake pool
                stakePool(poolId);

                /// Remove pool from open pools and add to staked pools
                for (uint i = 0; i < openPoolIds.length - 1; i++) {
                    openPoolIds[i] = openPoolIds[i + 1];
                }
                openPoolIds.pop();
                stakedPoolIds.push(poolId);

            }

            /// Update pool balances
            pool.depositAmount += newDepositAmount;
            pool.userStakes[userAddress] += newDepositAmount;

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
     * @dev Stake a pool
     */
    function stakePool(uint32 _poolId) private {
        address validatorAddress = inactiveValidatorAddresses[0];
        Validator memory validator = validators[validatorAddress];
        Pool storage pool = pools[_poolId];

        /// Deposit validator stake
        beaconDeposit.deposit{ value: pool.depositAmount }(
            validator.validatorPublicKey, // bytes
            abi.encodePacked(address(this)), // bytes
            validator.signature, // bytes
            validator.depositData // bytes32
        );

        /// Update the pool
        pool.operatorIds = validator.operatorIds;
        pool.validatorPublicKey = validator.validatorPublicKey;

        /// Remove validator from inactive validators and add to active validators
        for (uint i = 0; i < inactiveValidatorAddresses.length - 1; i++) {
            inactiveValidatorAddresses[i] = inactiveValidatorAddresses[i + 1];
        }
        inactiveValidatorAddresses.pop();
        activeValidatorAddresses.push(validatorAddress);

        emit ValidatorActivated(
            _poolId,
            pool.operatorIds,
            pool.validatorPublicKey
        );
    }

    /**
     * @dev Register a validator to the pool manager
     */
    function registerValidator(
        bytes32 _depositData,
        bytes[] calldata _encryptedShares, 
        uint32[] calldata _operatorIds, 
        bytes calldata _signature, 
        bytes calldata _validatorPublicKey
    ) public {
        address validatorAddress = toAddress(_validatorPublicKey);
        validators[validatorAddress] = Validator(_depositData, _encryptedShares, _operatorIds, _signature, _validatorPublicKey);
        inactiveValidatorAddresses.push(validatorAddress);

        emit ValidatorRegistered(
            _operatorIds,
            _validatorPublicKey
        );
    }

    // /**
    //  * @dev Unregister a validator from the pool manager
    //  */
    // function unRegisterValidator(

    // ) {
            // Todo mark a validator unregistered (distinguish from inactive)
    // }

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

    function getPoolUserDetails(uint32 _poolId, address _userAddress) external view returns (PoolUserDetails memory) {
        PoolUserDetails memory poolUserDetails = PoolUserDetails(
            getPoolBalance(_poolId), getPoolUserBalance(_poolId, _userAddress)
        );
        return poolUserDetails;
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
    ) public view returns (Balance memory) {
        uint256 rewards = getPoolUserRewards(_poolId, _userAddress);
        uint256 stake = getPoolUserStake(_poolId, _userAddress);
        return Balance(rewards, stake);
    }

    /**
     * @notice Get a user's rewards in a pool by user address and pool ID
     * @param _poolId - The pool ID
     * @param _userAddress - The user address
     * @return A user's rewards in a pool
     */
    function getPoolUserRewards(
        uint32 _poolId,
        address _userAddress
    ) public view returns (uint256) {
        // Todo get user stake share of balance (this is incomplete/incorrect)
        Pool storage pool = pools[_poolId];
        // getPoolUserStake(_poolId, _userAddress) * 100 / 32000000000000000000
        return pool.userStakes[_userAddress];
    }

    /**
     * @notice Get a user's stake in a pool by user address and pool ID
     * @param _poolId - The pool ID
     * @param _userAddress - The user address
     * @return A user's stake in a pool
     */
    function getPoolUserStake(
        uint32 _poolId,
        address _userAddress
    ) public view returns (uint256) {
        // Todo get user stake share of balance (this is incomplete/incorrect)
        // getPoolUserStake(_poolId, _userAddress) * 100 / 32000000000000000000
        return pools[_poolId].userStakes[_userAddress];
    }

    /**
     * @notice Get a pool's balance by pool ID
     * @param _poolId - The pool ID
     * @return The pool's balance
     */
    function getPoolBalance(
        uint32 _poolId
    ) public view returns (Balance memory) {
        Pool storage pool = pools[_poolId];
        uint256 rewards;
        uint256 stake;
        uint256 depositAmount = pool.depositAmount;

        if (pool.operatorIds.length == 0) {
            /// Return deposit amount for open pools
            stake = depositAmount;
        } else {
            /// Return balance feed amount for staked pools
            address validatorAddress = toAddress(pool.validatorPublicKey);
            uint256 balance = uint256(getLatestBalance(validatorAddress));
            rewards = balance - depositAmount;
            if (balance > depositAmount) {
                stake = depositAmount;
            } else {
                stake = balance;
            }
        }
        return Balance(rewards, stake);
    }

    /**
     * @notice Get a pool's validator public key by pool ID
     * @param _poolId - The pool ID
     * @return The pool's validator public key
     */
    function getPoolValidatorPublicKey(
        uint32 _poolId
    ) external view returns (bytes memory) {
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
     * @notice Get the latest balance for a validator (PoR)
     * @param _validatorAddress – The validator address
     * @return The latest balance
     */
    function getLatestBalance(address _validatorAddress) public view returns (int256) {
        console.log("Getting balance for", _validatorAddress);

        // prettier-ignore
        (
            /*uint80 roundID*/,
            int256 balance,
            /*uint256 startedAt*/,
            /*uint256 timeStamp*/,
            /*uint80 answeredInRound*/
        ) = balanceFeed.latestRoundData();

        return balance;
    }

    /***** IPoRAddressList interface methods *****/

    /**
     * @notice Get the length of the PoR (active) address list
     * @return The length of the PoR address list
     */
    function getPoRAddressListLength()
        external
        view
        override
        returns (uint256)
    {
        return activeValidatorAddresses.length;
    }

    /**
     * @notice Get a slice of the PoR address list as strings
     * @param _startIndex – The list start index
     * @param _endIndex – The list end index
     * @return The slice of the PoR address list as strings
     */
    function getPoRAddressList(
        uint256 _startIndex,
        uint256 _endIndex
    ) external view override returns (string[] memory) {
        if (_startIndex > _endIndex) {
            return new string[](0);
        }
        _endIndex = _endIndex > activeValidatorAddresses.length - 1
            ? activeValidatorAddresses.length - 1
            : _endIndex;
        string[] memory stringAddresses = new string[](
            _endIndex - _startIndex + 1
        );
        uint256 currIdx = _startIndex;
        uint256 strAddrIdx = 0;
        while (currIdx <= _endIndex) {
            stringAddresses[strAddrIdx] = toString(
                abi.encodePacked(activeValidatorAddresses[currIdx])
            );
            strAddrIdx++;
            currIdx++;
        }
        return stringAddresses;
    }

    /***** Utility methods *****/

    /**
     * @dev Convert bytes data to a string
     * @param _data - The bytes data
     * @return The corresponding string
     */
    function toString(bytes memory _data) private pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(2 + _data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < _data.length; i++) {
            str[2 + i * 2] = alphabet[uint256(uint8(_data[i] >> 4))];
            str[3 + i * 2] = alphabet[uint256(uint8(_data[i] & 0x0f))];
        }
        return string(str);
    }

    /**
     * @dev Convert a public key to an address
     * @param _publicKey - The public key bytes
     * @return The corresponding address 
     */
    function toAddress(bytes memory _publicKey) private pure returns (address) {
        return address(uint160(bytes20(keccak256(_publicKey))));
    }
}
