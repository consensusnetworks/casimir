// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "./CasimirUpkeep.sol";
import "./interfaces/ICasimirManager.sol";
import "./libraries/Types.sol";
import "./vendor/interfaces/IDepositContract.sol";
import "./vendor/interfaces/ISSVNetwork.sol";
import "./vendor/interfaces/IWETH9.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/pool/IUniswapV3PoolState.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

// Dev-only imports
import "hardhat/console.sol";

/**
 * @title Manager contract that accepts and distributes deposits
 */
contract CasimirManager is ICasimirManager, Ownable, ReentrancyGuard {
    /*************/
    /* Libraries */
    /*************/

    /** Use math for precise division */
    using Math for uint256;
    /** Use internal type for uint32 array */
    using Types32Array for uint32[];
    /** Use internal type for bytes array */
    using TypesBytesArray for bytes[];
    /** Use internal type for withdrawal array */
    using TypesWithdrawalArray for Withdrawal[];
    /** Use internal type for address */
    using TypesAddress for address;

    /*************/
    /* Constants */
    /*************/

    /* Distribution threshold (100 WEI) */
    uint256 private constant distributionThreshold = 100 wei;
    /** Scale factor for each rewards to stake ratio */
    uint256 private constant scaleFactor = 1 ether;
    /** Uniswap 0.3% fee tier */
    uint24 private constant uniswapFeeTier = 3000;
    /** Pool capacity */
    uint256 private constant poolCapacity = 32 ether;

    /*************/
    /* Immutable */
    /*************/

    /** DKG oracle address */
    address private immutable dkgOracleAddress;
    /** Upkeep contract */
    ICasimirUpkeep private immutable upkeep;
    /** Beacon deposit contract */
    IDepositContract private immutable beaconDeposit;
    /** LINK ERC-20 token contract */
    IERC20 private immutable linkToken;
    /** SSV network contract */
    ISSVNetwork private immutable ssvNetwork;
    /** SSV ERC-20 token contract */
    IERC20 private immutable ssvToken;
    /** Uniswap factory contract */
    IUniswapV3Factory private immutable swapFactory;
    /** Uniswap router contract  */
    ISwapRouter private immutable swapRouter;

    /***************/
    /* Enumerators */
    /***************/

    /** Token abbreviations */
    enum Token {
        LINK,
        SSV,
        WETH
    }

    /********************/
    /* Dynamic State */
    /********************/

    /** Latest active (consensus) balance reported from upkeep */
    uint256 latestActiveStake;
    /** Last pool ID created */
    uint32 nextPoolId;
    /** Token addresses */
    mapping(Token => address) private tokenAddresses;
    /** Unswapped tokens by address */
    mapping(address => uint256) private unswappedTokens;
    /** All users */
    mapping(address => User) private users;
    /** All pools (open, ready, or staked) */
    mapping(uint32 => Pool) private pools;
    /** Total deposits not yet in pools */
    uint256 private openDeposits;
    /** IDs of pools ready for initiation */
    uint32[] private readyPoolIds;
    /** IDS of pools pending deposit confirmation */
    uint32[] private pendingPoolIds;
    /** IDs of pools staked */
    uint32[] private stakedPoolIds;
    /** Public keys of staked validators */
    bytes[] private stakedValidatorPublicKeys;
    /** Exiting validator count */
    uint256 private exitingValidatorCount;
    /** Sum of scaled rewards to stake ratios (intial value required) */
    uint256 rewardsRatioSum = 1000 ether;
    /** Requested withdrawals */
    Withdrawal[] private requestedWithdrawalQueue;
    /** Pending withdrawals */
    Withdrawal[] private pendingWithdrawalQueue;
    /** Total requested withdrawals */
    uint256 private requestedWithdrawals;
    /** Total pending withdrawals */
    uint256 private pendingWithdrawals;
    /** LINK fee percentage (intial value required) */
    uint32 linkFee = 1;
    /** SSV fee percentage (intial value required) */
    uint32 ssvFee = 1;

    /**
     * @notice Constructor
     * @param beaconDepositAddress The Beacon deposit address
     * @param _dkgOracleAddress The DKG oracle address
     * @param functionsOracleAddress The Chainlink functions oracle address
     * @param functionsSubscriptionId The Chainlink functions subscription ID
     * @param linkTokenAddress The Chainlink token address
     * @param ssvNetworkAddress The SSV network address
     * @param ssvTokenAddress The SSV token address
     * @param swapFactoryAddress The Uniswap factory address
     * @param swapRouterAddress The Uniswap router address
     * @param wethTokenAddress The WETH contract address
     */
    constructor(
        address beaconDepositAddress,
        address _dkgOracleAddress,
        address functionsOracleAddress,
        uint64 functionsSubscriptionId,
        address linkTokenAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address swapFactoryAddress,
        address swapRouterAddress,
        address wethTokenAddress
    ) {
        beaconDeposit = IDepositContract(beaconDepositAddress);
        dkgOracleAddress = _dkgOracleAddress;
        linkToken = IERC20(linkTokenAddress);
        tokenAddresses[Token.LINK] = linkTokenAddress;
        ssvNetwork = ISSVNetwork(ssvNetworkAddress);
        tokenAddresses[Token.SSV] = ssvTokenAddress;
        ssvToken = IERC20(ssvTokenAddress);
        swapFactory = IUniswapV3Factory(swapFactoryAddress);
        swapRouter = ISwapRouter(swapRouterAddress);
        tokenAddresses[Token.WETH] = wethTokenAddress;

        upkeep = new CasimirUpkeep(
            address(this),
            functionsOracleAddress,
            functionsSubscriptionId
        );
    }

    /**
     * @notice Deposit user stake
     */
    function depositStake() external payable nonReentrant {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        uint256 processedAmount = processFees(msg.value, getFees());
        require(
            processedAmount >= distributionThreshold,
            "Stake amount must be greater than 100 WEI"
        );

        if (users[msg.sender].stake0 > 0) {
            users[msg.sender].stake0 = getUserStake(msg.sender);
        }
        users[msg.sender].rewardsRatioSum0 = rewardsRatioSum;
        users[msg.sender].stake0 += processedAmount;

        distributeStake(processedAmount);

        emit StakeDeposited(msg.sender, processedAmount);
    }

    /**
     * @notice Rebalance the reward to stake ratio and redistribute swept rewards
     * @param activeStake The active consensus stake
     * @param sweptRewards The swept consensus rewards
     * @param sweptExits The swept consensus exits
     */
    function rebalanceStake(uint256 activeStake, uint256 sweptRewards, uint256 sweptExits) external {
        require(
            msg.sender == address(upkeep),
            "Only upkeep can rebalance stake"
        );

        int256 current = int256(activeStake + sweptRewards + sweptExits);
        int256 previous = int256(latestActiveStake + pendingPoolIds.length * poolCapacity);
        int256 change = current - previous;

        if (change > 0) {
            uint256 rewards = SafeCast.toUint256(change);
            // /** Reward fees set to zero for testing */
            // uint256 processedReward = processFees(reward, Fees(0, 0));
            rewardsRatioSum += Math.mulDiv(rewardsRatioSum, rewards, getStake());
            emit StakeRebalanced(rewards);
        } else if (change < 0) {
            uint256 penalty = SafeCast.toUint256(change);
            rewardsRatioSum -= Math.mulDiv(rewardsRatioSum, penalty, getStake());
            emit StakeRebalanced(penalty);
        }

        latestActiveStake = activeStake;

        if (sweptRewards > 0) {
            distributeStake(sweptRewards);
            emit RewardsDeposited(sweptRewards);
        }
    }

    /**
     * @dev Distribute stake to open pools
     * @param amount The amount of stake to distribute
     */
    function distributeStake(uint256 amount) private {
        while (amount > 0) {
            uint256 remainingCapacity = poolCapacity - openDeposits;
            if (remainingCapacity > amount) {
                openDeposits += amount;
                amount = 0;
            } else {
                uint32 poolId = nextPoolId;
                nextPoolId++;
                Pool storage pool;
                pool = pools[poolId];
                openDeposits = 0;
                amount -= remainingCapacity;
                pool.deposits = poolCapacity;
                readyPoolIds.push(poolId);

                emit PoolReady(poolId);
            }
        }
    }

    /**
     * @notice Request to withdraw user stake
     * @param amount The amount of stake to withdraw
     */
    function requestWithdrawal(uint256 amount) external nonReentrant {
        users[msg.sender].stake0 = getUserStake(msg.sender);
        require(
            users[msg.sender].stake0 > amount,
            "Withdrawing more than user stake"
        );

        requestedWithdrawalQueue.push(
            Withdrawal({user: msg.sender, amount: amount})
        );
        requestedWithdrawals += amount;

        emit WithdrawalRequested(msg.sender, amount);
    }

    /**
     * @notice Initiate a given count of requested withdrawals
     * @param count The number of withdrawals to initiate
     */
    function initiateRequestedWithdrawals(uint256 count) external {
        require(
            msg.sender == address(upkeep),
            "Only upkeep can initiate withdrawals"
        );

        while (count > 0) {
            count--;

            Withdrawal memory withdrawal = requestedWithdrawalQueue[0];
            users[withdrawal.user].rewardsRatioSum0 = rewardsRatioSum;
            users[withdrawal.user].stake0 -= withdrawal.amount;
            requestedWithdrawalQueue.remove(0);
            requestedWithdrawals -= withdrawal.amount;

            if (withdrawal.amount <= openDeposits) {
                openDeposits -= withdrawal.amount;
                withdrawal.user.send(withdrawal.amount);

                emit WithdrawalCompleted(
                    withdrawal.user,
                    withdrawal.amount
                );
            } else {
                pendingWithdrawalQueue.push(withdrawal);
                pendingWithdrawals += withdrawal.amount;

                emit WithdrawalInitiated(
                    withdrawal.user,
                    withdrawal.amount
                );
            }
        }
    }

    /**
     * @notice Complete a given count of pending withdrawals
     * @param count The number of withdrawals to complete
     */
    function completePendingWithdrawals(uint256 count) external {
        require(
            msg.sender == address(upkeep),
            "Only upkeep can complete withdrawals"
        );

        while (count > 0) {
            count--;

            Withdrawal memory withdrawal = pendingWithdrawalQueue[0];
            pendingWithdrawalQueue.remove(0);
            pendingWithdrawals -= withdrawal.amount;
            withdrawal.user.send(withdrawal.amount);

            emit WithdrawalCompleted(withdrawal.user, withdrawal.amount);
        }
    }

    /**
     * @notice Initiate the next ready pool
     * @param depositDataRoot The deposit data root
     * @param publicKey The validator public key
     * @param operatorIds The operator IDs
     * @param sharesEncrypted The encrypted shares
     * @param sharesPublicKeys The public keys of the shares
     * @param signature The signature
     * @param withdrawalCredentials The withdrawal credentials
     */
    function initiatePoolDeposit(   
        bytes32 depositDataRoot,
        bytes calldata publicKey,
        uint32[] memory operatorIds,
        bytes[] memory sharesEncrypted,
        bytes[] memory sharesPublicKeys,
        bytes calldata signature,
        bytes calldata withdrawalCredentials
    ) external {
        require(
            msg.sender == dkgOracleAddress, 
            "Only DKG oracle can initiate pools"
        );
        require(readyPoolIds.length > 0, "No ready pools");

        // Todo validate deposit data

        uint32 poolId = readyPoolIds[0];
        Pool storage pool = pools[poolId];
        pool.depositDataRoot = depositDataRoot;
        pool.publicKey = publicKey;
        pool.operatorIds = operatorIds;
        pool.sharesEncrypted = sharesEncrypted;
        pool.sharesPublicKeys = sharesPublicKeys;
        pool.signature = signature;
        pool.withdrawalCredentials = withdrawalCredentials;
        readyPoolIds.remove(0);
        pendingPoolIds.push(poolId); 

        beaconDeposit.deposit{value: pool.deposits}(
            pool.publicKey,
            pool.withdrawalCredentials,
            pool.signature,
            pool.depositDataRoot
        );

        // Todo update for v3 SSV contracts and dynamic fees
        uint256 mockSSVFee = 5 ether;
        ssvToken.approve(address(ssvNetwork), mockSSVFee);
        ssvNetwork.registerValidator(
            pool.publicKey,
            pool.operatorIds,
            pool.sharesPublicKeys,
            pool.sharesEncrypted,
            mockSSVFee
        );

        emit PoolInitiated(poolId);
    }

    /**
     * @notice Complete a given count of the next pending pools
     * @param count The number of pools to complete
     */
    function completePoolDeposits(uint256 count) external {
        require(
            msg.sender == address(upkeep),
            "Only upkeep can complete pending pools"
        );
        require(pendingPoolIds.length >= count, "Not enough pending pools");

        while (count > 0) {
            count--;

            uint32 poolId = pendingPoolIds[0];
            Pool memory pool = pools[poolId];
            pendingPoolIds.remove(0);
            stakedPoolIds.push(poolId);
            stakedValidatorPublicKeys.push(pool.publicKey);

            emit PoolCompleted(poolId);
        }
    }

    /**
     * @notice Request a given count of staked pool exits
     * @param count The number of exits to request
     */
    function requestPoolExits(uint256 count) external {
        require(
            msg.sender == address(upkeep),
            "Only upkeep can request pool exits"
        );

        uint256 index = 0;
        while (count > 0) {
            uint32 poolId = stakedPoolIds[index];
            Pool storage pool = pools[poolId];

            if (!pool.exiting) {
                count--;
                index++;

                pool.exiting = true;
                exitingValidatorCount++;

                emit PoolExitRequested(poolId);
            }
        }
    }

    /**
     * @notice Complete a pool exit
     * @param poolIndex The staked pool index
     * @param validatorIndex The staked validator (internal) index
     */
    function completePoolExit(
        uint256 poolIndex,
        uint256 validatorIndex
    ) external {
        require(
            msg.sender == address(upkeep),
            "Only upkeep can complete pool exits"
        );
        require(exitingValidatorCount > 0, "No exiting validators");

        uint32 poolId = stakedPoolIds[poolIndex];
        Pool storage pool = pools[poolId];

        require(pool.exiting, "Pool is not exiting");

        bytes memory validatorPublicKey = pool.publicKey;
        bytes memory stakedValidatorPublicKey = stakedValidatorPublicKeys[
            validatorIndex
        ];

        require(
            keccak256(validatorPublicKey) ==
                keccak256(stakedValidatorPublicKey),
            "Pool validator does not match staked validator"
        );

        stakedPoolIds.remove(poolIndex);
        delete pools[poolId];
        stakedValidatorPublicKeys.remove(validatorIndex);
        exitingValidatorCount--;

        ssvNetwork.removeValidator(validatorPublicKey);

        emit PoolExited(poolId);
    }

    /**
     * @notice Register an operator with the pool manager
     * @param operatorId The operator ID
     */
    function registerOperator(uint32 operatorId) external payable {
        //
    }

    /**
     * @notice Reshare a given pool's validator
     * @param poolId The pool ID
     * @param operatorIds The operator IDs
     * @param sharesEncrypted The encrypted shares
     * @param sharesPublicKeys The public keys of the shares
     */
    function resharePool(
        uint32 poolId,
        uint32[] memory operatorIds,
        bytes[] memory sharesEncrypted,
        bytes[] memory sharesPublicKeys
    ) external {
        require(
            msg.sender == dkgOracleAddress, 
            "Only DKG oracle can initiate pools"
        );

        Pool memory pool = pools[poolId];
        require(
            pool.reshareCount < 3,
            "Pool has been reshared twice"
        );

        pool.operatorIds = operatorIds;
        pool.sharesEncrypted = sharesEncrypted;
        pool.sharesPublicKeys = sharesPublicKeys;
        pool.reshareCount++;

        emit PoolReshared(poolId);
    }

    /**
     * @dev Process fees from a deposit
     * @param depositAmount The full deposit amount
     * @param fees The fees to process
     * @return processedAmount The processed deposit amount
     */
    function processFees(
        uint256 depositAmount,
        Fees memory fees
    ) private returns (uint256 processedAmount) {
        uint32 feePercent = fees.LINK + fees.SSV;
        uint256 ethAmount = Math.mulDiv(depositAmount, 100, 100 + feePercent);
        uint256 feeAmount = depositAmount - ethAmount;

        if (feeAmount > 0) {
            wrapFees(feeAmount);

            (, uint256 unswappedLINK) = swapFees(
                tokenAddresses[Token.WETH],
                tokenAddresses[Token.LINK],
                Math.mulDiv(feeAmount, fees.LINK, feePercent)
            );
            linkToken.approve(
                address(upkeep),
                linkToken.balanceOf(address(this))
            );
            unswappedTokens[tokenAddresses[Token.LINK]] += unswappedLINK;

            (, uint256 unswappedSSV) = swapFees(
                tokenAddresses[Token.WETH],
                tokenAddresses[Token.SSV],
                Math.mulDiv(feeAmount, fees.SSV, feePercent)
            );
            ssvToken.approve(
                address(upkeep),
                ssvToken.balanceOf(address(this))
            );
            unswappedTokens[tokenAddresses[Token.SSV]] += unswappedSSV;
        }
        processedAmount = ethAmount;
    }

    /**
     * @dev Deposit WETH to use ETH in swaps
     * @param amount The amount of ETH to deposit
     */
    function wrapFees(uint256 amount) private {
        IWETH9 wethToken = IWETH9(tokenAddresses[Token.WETH]);
        wethToken.deposit{value: amount}();
        wethToken.approve(
            address(swapRouter),
            wethToken.balanceOf(address(this))
        );
    }

    /**
     * @dev Swap token in for token out
     */
    function swapFees(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) private returns (uint256 amountOut, uint256 amountUnswapped) {
        address swapPool = swapFactory.getPool(
            tokenIn,
            tokenOut,
            uniswapFeeTier
        );
        uint256 liquidity = IUniswapV3PoolState(swapPool).liquidity();
        if (liquidity < amountIn) {
            amountUnswapped = amountIn - liquidity;
            amountIn = liquidity;
        }
        if (amountIn > 0) {
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
                .ExactInputSingleParams({
                    tokenIn: tokenIn,
                    tokenOut: tokenOut,
                    fee: uniswapFeeTier,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: amountIn,
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                });
            amountOut = swapRouter.exactInputSingle(params);
        }
    }

    /**
     * @dev Update link fee
     * @param newFee The new fee
     */
    function setLINKFee(uint32 newFee) external onlyOwner {
        linkFee = newFee;
    }

    /**
     * @dev Update ssv fee
     * @param newFee The new fee
     */
    function setSSVFee(uint32 newFee) external onlyOwner {
        ssvFee = newFee;
    }

    /**
     * @notice Update the functions oracle address
     * @param oracle New oracle address
     */
    function setOracleAddress(address oracle) external onlyOwner {
        upkeep.setOracleAddress(oracle);
    }

    /**
     * @notice Get the total manager stake
     * @return stake The total manager stake
     */
    function getStake() public view returns (uint256 stake) {
        stake = getBufferedStake() + getActiveStake();
    }

    /**
     * @notice Get the total manager buffered (execution) stake
     * @return bufferedStake The total manager buffered (execution) stake
     */
    function getBufferedStake() public view returns (uint256 bufferedStake) {
        bufferedStake =
            (readyPoolIds.length + pendingPoolIds.length) *
            poolCapacity +
            openDeposits;
    }

    /**
     * @notice Get the total manager swept (execution) stake
     * @return sweptStake The total manager swept (execution) stake
     */
    function getSweptStake() public view returns (uint256 sweptStake) {
        sweptStake = address(this).balance - getBufferedStake();
    }

    /**
     * @notice Get the manager active (consensus) stake
     * @return activeStake The total manager active (consensus) stake
     */
    function getActiveStake() public view returns (uint256 activeStake) {
        activeStake = latestActiveStake;
    }

    /**
     * @notice Get the total user stake for a given user address
     * @param userAddress The user address
     * @return userStake The total user stake
     */
    function getUserStake(
        address userAddress
    ) public view returns (uint256 userStake) {
        require(users[userAddress].stake0 > 0, "User does not have a stake");
        userStake = Math.mulDiv(
            users[userAddress].stake0,
            rewardsRatioSum,
            users[userAddress].rewardsRatioSum0
        );
    }

    /**
     * @notice Get the current token fees as percentages
     * @return fees The current token fees as percentages
     */
    function getFees() public view returns (Fees memory fees) {
        fees = Fees(linkFee, ssvFee);
    }

    // External view functions

    /**
     * @notice Get the total requested withdrawals
     * @return requestedWithdrawals The total requested withdrawals
     */
    function getRequestedWithdrawals() external view returns (uint256) {
        return requestedWithdrawals;
    }

    /**
     * @notice Get the total pending withdrawals
     * @return pendingWithdrawals The total pending withdrawals
     */
    function getPendingWithdrawals() external view returns (uint256) {
        return pendingWithdrawals;
    }

    /**
     * @notice Get the requested withdrawal queue
     * @return requestedWithdrawalQueue The requested withdrawal queue
     */
    function getRequestedWithdrawalQueue()
        external
        view
        returns (Withdrawal[] memory) {
        return requestedWithdrawalQueue;
    }

    /**
     * @notice Get the pending withdrawal queue
     * @return pendingWithdrawalQueue The pending withdrawal queue
     */
    function getPendingWithdrawalQueue()
        external
        view
        returns (Withdrawal[] memory) {
        return pendingWithdrawalQueue;
    }

    /**
     * @notice Get staked validator public keys
     * @return A list of active validator public keys
     */
    function getStakedValidatorPublicKeys()
        external
        view
        returns (bytes[] memory)
    {
        return stakedValidatorPublicKeys;
    }

    /**
     * @notice Get the count of exiting validators
     * @return The count of exiting validators
     */
    function getExitingValidatorCount() external view returns (uint256) {
        return exitingValidatorCount;
    }

    /**
     * @notice Get a list of all filled pool IDs
     * @return A list of all filled pool IDs
     */
    function getFilledPoolIds() external view returns (uint32[] memory) {
        return readyPoolIds;
    }

    /**
     * @notice Get a list of all ready pool IDs
     * @return A list of all ready pool IDs
     */
    function getReadyPoolIds() external view returns (uint32[] memory) {
        return readyPoolIds;
    }

    /**
     * @notice Get a list of all pending pool IDs
     * @return A list of all pending pool IDs
     */
    function getPendingPoolIds() external view returns (uint32[] memory) {
        return pendingPoolIds;
    }

    /**
     * @notice Get a list of all staked pool IDs
     * @return A list of all staked pool IDs
     */
    function getStakedPoolIds() external view returns (uint32[] memory) {
        return stakedPoolIds;
    }

    /**
     * @notice Get the total manager open deposits
     * @return The total manager open deposits
     */
    function getOpenDeposits() external view returns (uint256) {
        return openDeposits;
    }

    /**
     * @notice Get a pool by ID
     * @param poolId The pool ID
     * @return pool The pool details
     */
    function getPool(
        uint32 poolId
    ) external view returns (Pool memory pool) {
        pool = pools[poolId];
    }

    /**
     * @notice Get the LINK fee percentage to charge on each deposit
     * @return The LINK fee percentage to charge on each deposit
     */
    function getLINKFee() external view returns (uint32) {
        return linkFee;
    }

    /**
     * @notice Get the SSV fee percentage to charge on each deposit
     * @return The SSV fee percentage to charge on each deposit
     */
    function getSSVFee() external view returns (uint32) {
        return ssvFee;
    }

    /**
     * @notice Get the upkeep address
     * @return upkeepAddress The upkeep address
     */
    function getUpkeepAddress()
        external
        view
        returns (address upkeepAddress)
    {
        upkeepAddress = address(upkeep);
    }

    // Dev-only functions

    /**
     * @dev Will be removed in production
     * @dev Used for mocking sweeps from Beacon to the manager
     */
    receive() external payable nonReentrant {}
}
