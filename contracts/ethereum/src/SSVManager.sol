// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./interfaces/IDepositContract.sol";
import "./interfaces/IPoRAddressList.sol";
import "./interfaces/ISSVNetwork.sol";
import "./interfaces/ISSVToken.sol";
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
        bytes32 depositDataRoot;
        uint32[] operatorIds;
        bytes[] sharesEncrypted;
        bytes[] sharesPublicKeys;
        bytes signature;
        bytes withdrawalCredentials;
    }

    /***** Storage *****/

    /** Pool ID generator */
    Counters.Counter lastPoolId;
    /** Token addresses */
    mapping(Token => address) private tokens;
    /** Beacon deposit contract */
    IDepositContract private immutable beaconDeposit;
    /** Chainlink rewards feed contract */
    AggregatorV3Interface private immutable linkFeed;
    /** SSV network contract */
    ISSVNetwork private immutable ssvNetwork;
    /** LINK ERC-20 token contract */
    IERC20 private immutable linkToken;
    /** SSV ERC-20 token contract */
    ISSVToken private immutable ssvToken;
    /** Uniswap 0.3% fee tier */
    uint24 private immutable swapFee = 3000;
    /** Uniswap router contract  */
    ISwapRouter private immutable swapRouter;
    /** All users who have deposited to pools */
    mapping(address => User) private users;
    /** SSV pools */
    mapping(uint32 => Pool) private pools;
    /** Pool IDs of pools accepting deposits */
    uint32[] private openPoolIds;
    /** Pool IDs of staked pools */
    uint32[] private stakedPoolIds;
    /** Validators (inactive and active) */
    mapping(bytes => Validator) private validators;
    /** Active validator public keys */
    bytes[] private activeValidatorPublicKeys;
    /** Inactive validator public keys */
    bytes[] private inactiveValidatorPublicKeys;

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
        bytes publicKey
    );
    /** Event signaling a validator registration */
    event ValidatorAdded(uint32[] operatorIds, bytes publicKey);

    /**
     * @notice Constructor
     * @param beaconDepositAddress The Beacon deposit address
     * @param linkFeedAddress The Chainlink data feed address
     * @param linkTokenAddress The Chainlink token address
     * @param ssvNetworkAddress The SSV network address
     * @param ssvTokenAddress The SSV token address
     * @param swapRouterAddress The Uniswap router address
     * @param wethTokenAddress The WETH contract address
     */
    constructor(
        address beaconDepositAddress,
        address linkFeedAddress,
        address linkTokenAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address swapRouterAddress,
        address wethTokenAddress
    ) {
        beaconDeposit = IDepositContract(beaconDepositAddress);
        linkFeed = AggregatorV3Interface(linkFeedAddress);
        tokens[Token.LINK] = linkTokenAddress;
        linkToken = IERC20(linkTokenAddress);
        ssvNetwork = ISSVNetwork(ssvNetworkAddress);
        tokens[Token.SSV] = ssvTokenAddress;
        ssvToken = ISSVToken(ssvTokenAddress);
        swapRouter = ISwapRouter(swapRouterAddress);
        tokens[Token.WETH] = wethTokenAddress;
    }

    /**
     * @notice Deposit to the pool manager
     */
    function deposit() external payable {
        require(inactiveValidatorPublicKeys.length > 0, "no validators ready");

        address userAddress = msg.sender;
        uint256 time = block.timestamp;

        /// Swap fees to protocol token funds
        DepositFunds memory depositFunds = processDepositFunds(msg.value);

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
                lastPoolId.increment();
                poolId = uint32(lastPoolId.current());

                /// Push new open pool ID
                openPoolIds.push(poolId);
            }

            /// Get the pool
            Pool storage pool;
            pool = pools[poolId];

            /// Get contract amount for next open pool
            uint256 poolDepositedAmount = pool.depositAmount;

            /// Deposit to pool
            uint256 poolRequiredAmount = 32 * 1e18 - poolDepositedAmount;
            if (poolRequiredAmount > depositFunds.stakeAmount) {
                /// Set pool stake amount to total available
                pool.depositAmount += depositFunds.stakeAmount;
                pool.userStakes[userAddress] += depositFunds.stakeAmount;
                depositFunds.stakeAmount = 0;
            } else {
                /// Set pool stake amount to total required
                pool.depositAmount += poolRequiredAmount;
                pool.userStakes[userAddress] += poolRequiredAmount;
                depositFunds.stakeAmount -= poolRequiredAmount;

                /// Start a new validator to stake pool
                activateValidator(poolId);

                /// Remove pool from open pools and add to staked pools
                for (uint i = 0; i < openPoolIds.length - 1; i++) {
                    openPoolIds[i] = openPoolIds[i + 1];
                }
                openPoolIds.pop();
                stakedPoolIds.push(poolId);
            }

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
     * @param depositAmount The deposit amount
     * @return The fee and stake deposit amounts
     */
    function processDepositFunds(
        uint256 depositAmount
    ) private returns (DepositFunds memory) {
        Fees memory fees = getFees();
        uint32 feePercent = fees.LINK + fees.SSV;
        uint256 stakeAmount = (depositAmount * 100) / (100 + feePercent);
        uint256 feeAmount = depositAmount - stakeAmount;

        /// Wrap ETH fees in ERC-20 to use in swap
        wrap(feeAmount);

        uint256 linkAmount = swap(
            tokens[Token.WETH],
            tokens[Token.LINK],
            (feeAmount * fees.LINK) / feePercent
        );

        uint256 ssvAmount = swap(
            tokens[Token.WETH],
            tokens[Token.SSV],
            (feeAmount * fees.SSV) / feePercent
        );

        return DepositFunds(linkAmount, ssvAmount, stakeAmount);
    }

    /**
     * @dev Deposit WETH to use ETH in swaps
     * @param amount The amount of ETH to deposit
     */
    function wrap(uint256 amount) private {
        IWETH9 wethToken = IWETH9(tokens[Token.WETH]);
        wethToken.deposit{value: amount}();
        wethToken.approve(address(swapRouter), amount);
    }

    /**
     * @dev Swap one token-in for another token-out
     * @param tokenIn The token-in address
     * @param tokenOut The token-out address
     * @param amountIn The amount of token-in to input
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

    /**
     * @dev Activate a pool validator on beacon and SSV
     * @param poolId The pool ID
     */
    function activateValidator(uint32 poolId) private {
        bytes memory publicKey = inactiveValidatorPublicKeys[0];
        Validator memory validator = validators[publicKey];
        Pool storage pool = pools[poolId];
        uint256 mockSSVFee = 5 * 1e18;

        /// Deposit validator stake
        beaconDeposit.deposit{value: pool.depositAmount}(
            publicKey, // bytes
            // Todo show proof that this is the contract
            validator.withdrawalCredentials, // bytes
            validator.signature, // bytes
            validator.depositDataRoot // bytes32
        );

        /// Register validator with SSV Network
        ssvToken.approve(address(ssvNetwork), mockSSVFee);
        ssvNetwork.registerValidator(
            publicKey, // bytes
            validator.operatorIds, // uint32[]
            validator.sharesPublicKeys, // bytes[]
            validator.sharesEncrypted, // bytes[],
            mockSSVFee // uint256 (fees handled on user deposits)
        );

        /// Update the pool
        pool.operatorIds = validator.operatorIds;
        pool.validatorPublicKey = publicKey;

        /// Remove validator from inactive validators and add to active validators
        for (uint i = 0; i < inactiveValidatorPublicKeys.length - 1; i++) {
            inactiveValidatorPublicKeys[i] = inactiveValidatorPublicKeys[i + 1];
        }
        inactiveValidatorPublicKeys.pop();
        activeValidatorPublicKeys.push(publicKey);

        emit ValidatorActivated(
            poolId,
            pool.operatorIds,
            pool.validatorPublicKey
        );
    }

    // /**
    //  * @dev Deactivate a validator from beacon and SSV
    //  */
    // function removeValidator(

    // ) {
    // Todo mark a validator inactive (distinguish from active)
    // }

    /**
     * @dev Add a validator to the pool manager
     */
    function addValidator(
        bytes32 depositDataRoot,
        bytes calldata publicKey,
        uint32[] memory operatorIds,
        bytes[] memory sharesEncrypted,
        bytes[] memory sharesPublicKeys,
        bytes calldata signature,
        bytes calldata withdrawalCredentials
    ) public {
        validators[publicKey] = Validator(
            depositDataRoot,
            operatorIds,
            sharesEncrypted,
            sharesPublicKeys,
            signature,
            withdrawalCredentials
        );
        inactiveValidatorPublicKeys.push(publicKey);

        emit ValidatorAdded(operatorIds, publicKey);
    }

    // /**
    //  * @dev Remove a validator from the pool manager
    //  */
    // function removeValidator(

    // ) {
    // Todo mark a validator removed (distinguish from inactive)
    // }

    /**
     * @notice Get active validator public keys
     * @return A list of active validator public keys
     */
    function getActiveValidatorPublicKeys()
        external
        view
        returns (bytes[] memory)
    {
        return activeValidatorPublicKeys;
    }

    /**
     * @notice Get inactive validator public keys
     * @return A list of inactive validator public keys
     */
    function getInactiveValidatorPublicKeys()
        external
        view
        returns (bytes[] memory)
    {
        return inactiveValidatorPublicKeys;
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
     * @param userAddress The user address
     * @return A list of a user's pool IDs
     */
    function getUserPoolIds(
        address userAddress
    ) external view returns (uint32[] memory) {
        return users[userAddress].poolIds;
    }

    function getPoolUserDetails(
        uint32 poolId,
        address userAddress
    ) external view returns (PoolUserDetails memory) {
        PoolUserDetails memory poolUserDetails = PoolUserDetails(
            getPoolBalance(poolId),
            getPoolUserBalance(poolId, userAddress)
        );
        return poolUserDetails;
    }

    /**
     * @notice Get a user's balance in a pool by user address and pool ID
     * @param poolId The pool ID
     * @param userAddress The user address
     * @return A user's balance in a pool
     */
    function getPoolUserBalance(
        uint32 poolId,
        address userAddress
    ) public view returns (Balance memory) {
        uint256 rewards = getPoolUserRewards(poolId, userAddress);
        uint256 stake = getPoolUserStake(poolId, userAddress);
        return Balance(rewards, stake);
    }

    /**
     * @notice Get a user's rewards in a pool by user address and pool ID
     * @param poolId The pool ID
     * @param userAddress The user address
     * @return A user's rewards in a pool
     */
    function getPoolUserRewards(
        uint32 poolId,
        address userAddress
    ) public view returns (uint256) {
        // Todo get user stake share of balance (this is incomplete/incorrect)
        Pool storage pool = pools[poolId];
        // getPoolUserStake(poolId, userAddress) * 100 / 32*1e18
        return pool.userStakes[userAddress];
    }

    /**
     * @notice Get a user's stake in a pool by user address and pool ID
     * @param poolId The pool ID
     * @param userAddress The user address
     * @return A user's stake in a pool
     */
    function getPoolUserStake(
        uint32 poolId,
        address userAddress
    ) public view returns (uint256) {
        return pools[poolId].userStakes[userAddress];
    }

    /**
     * @notice Get a pool's balance by pool ID
     * @param poolId The pool ID
     * @return The pool's balance
     */
    function getPoolBalance(
        uint32 poolId
    ) public view returns (Balance memory) {
        Pool storage pool = pools[poolId];
        uint256 rewards;
        uint256 stake;
        uint256 depositAmount = pool.depositAmount;

        if (pool.operatorIds.length == 0) {
            /// Return deposit amount for open pools
            stake = depositAmount;
        } else {
            /// Return balance feed amount for staked pools
            bytes memory validatorPublicKey = pool.validatorPublicKey;
            uint256 balance = uint256(
                getLatestBalance(poolId, validatorPublicKey)
            );
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
     * @param poolId The pool ID
     * @return The pool's validator public key
     */
    function getPoolValidatorPublicKey(
        uint32 poolId
    ) external view returns (bytes memory) {
        return pools[poolId].validatorPublicKey;
    }

    /**
     * @notice Get a pool's operators by pool ID
     * @param poolId The pool ID
     * @return The pool's operators
     */
    function getPoolOperatorIds(
        uint32 poolId
    ) external view returns (uint32[] memory) {
        return pools[poolId].operatorIds;
    }

    /**
     * @notice Get the latest balance for a validator (PoR)
     * @param validatorPublicKey The validator address
     * @return The latest balance
     */
    function getLatestBalance(
        uint32 poolId,
        bytes memory validatorPublicKey
    ) public view returns (int256) {
        console.log("Getting balance for", toAddress(validatorPublicKey));

        // prettier-ignore
        // (
        //     /*uint80 roundID*/,
        //     int256 balance,
        //     /*uint256 startedAt*/,
        //     /*uint256 timeStamp*/,
        //     /*uint80 answeredInRound*/
        // ) = linkFeed.latestRoundData();
        int256 balance = int256(pools[poolId].depositAmount);
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
        return activeValidatorPublicKeys.length;
    }

    /**
     * @notice Get a slice of the PoR address list as strings
     * @param startIndex The list start index
     * @param endIndex The list end index
     * @return The slice of the PoR address list as strings
     */
    function getPoRAddressList(
        uint256 startIndex,
        uint256 endIndex
    ) external view override returns (string[] memory) {
        if (startIndex > endIndex) {
            return new string[](0);
        }
        endIndex = endIndex > activeValidatorPublicKeys.length - 1
            ? activeValidatorPublicKeys.length - 1
            : endIndex;
        string[] memory stringAddresses = new string[](
            endIndex - startIndex + 1
        );
        uint256 currIdx = startIndex;
        uint256 strAddrIdx = 0;
        while (currIdx <= endIndex) {
            stringAddresses[strAddrIdx] = toString(
                abi.encodePacked(toAddress(activeValidatorPublicKeys[currIdx]))
            );
            strAddrIdx++;
            currIdx++;
        }
        return stringAddresses;
    }

    /***** Utility methods *****/

    /**
     * @dev Convert bytes data to a string
     * @param data The bytes data
     * @return The corresponding string
     */
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

    /**
     * @dev Convert a public key to an address
     * @param publicKey The public key bytes
     * @return The corresponding address
     */
    function toAddress(bytes memory publicKey) private pure returns (address) {
        return address(uint160(bytes20(keccak256(publicKey))));
    }
}
