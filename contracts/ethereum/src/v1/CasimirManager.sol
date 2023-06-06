// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./CasimirPool.sol";
import "./CasimirRegistry.sol";
import "./CasimirUpkeep.sol";
import "./interfaces/ICasimirManager.sol";
import "./libraries/Types.sol";
import "./vendor/interfaces/IDepositContract.sol";
import "./vendor/interfaces/ISSVNetwork.sol";
import "./vendor/interfaces/IWETH9.sol";
import "./vendor/interfaces/KeeperRegistrarInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AutomationRegistryInterface2_0.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
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

    /** User action period */
    uint256 private constant actionPeriod = 1 days;
    /** Max user actions per period */
    uint256 private constant maxActionsPerPeriod = 5;
    /** Compound minimum (0.1 ETH) */
    uint256 private constant compoundMinimum = 100000000 gwei;
    /** Minimum balance for upkeep registration (0.1 LINK) */
    uint256 upkeepRegistrationMinimum = 100000000 gwei;
    /** Stake minimum (0.0001 ETH) */
    uint256 private constant stakeMinimum = 100000000000000;
    /** Scale factor for each rewards to stake ratio */
    uint256 private constant scaleFactor = 1 ether;
    /** Uniswap 0.3% fee tier */
    uint24 private constant uniswapFeeTier = 3000;
    /** Pool capacity */
    uint256 private constant poolCapacity = 32 ether;

    /*************/
    /* Immutable */
    /*************/

    /** Manager oracle address */
    address private immutable oracleAddress;
    /** Registry contract */
    ICasimirRegistry private immutable registry;
    /** Upkeep contract */
    ICasimirUpkeep private immutable upkeep;
    /** Beacon deposit contract */
    IDepositContract private immutable beaconDeposit;
    /** Keeper registrar contract */
    KeeperRegistrarInterface private immutable linkRegistrar;
    /** Keeper registry contract */
    AutomationRegistryInterface private immutable linkRegistry;
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

    /********************/
    /* Dynamic State */
    /********************/

    /** Upkeep ID */
    uint256 private upkeepId;
    /** Current report period */
    uint32 private reportPeriod;
    /** Last pool ID created */
    uint32 private lastPoolId;
    /** Latest active balance */
    uint256 private latestActiveBalance;
    /** Latest active balance after fees */
    uint256 private latestActiveBalanceAfterFees;
    /** Latest active rewards */
    int256 private latestActiveRewardBalance;
    /** Requested pool exit reports */
    uint256 private requestedCompletedExitReports;
    /** Requested pool unexpected exit reports */
    uint256 private requestedForcedExitReports;
    /** Exited balance */
    uint256 private finalizableExitedBalance;
    /** Exited pool count */
    uint256 finalizableCompletedExits;
    /** Token addresses */
    mapping(Token => address) private tokenAddresses;
    /** All users */
    mapping(address => User) private users;
    /** Sum of scaled rewards to balance ratios (intial value required) */
    uint256 private stakeRatioSum = 1000 ether;
    /** Pending withdrawals */
    Withdrawal[] private requestedWithdrawalQueue;
    /** Total pending withdrawal amount */
    uint256 private requestedWithdrawalBalance;
    /** Total pending withdrawals count */
    uint256 private requestedWithdrawals;
    /** All pool addresses */
    mapping(uint32 => address) private poolAddresses;
    /** Validator tip balance */
    uint256 private tipBalance;
    /** Pool recovered balances */
    mapping(uint32 => uint256) private recoveredBalances;
    /** Total deposits not yet in pools */
    uint256 private prepoolBalance;
    /** Total exited deposits */
    uint256 private exitedBalance;
    /** Total reserved (execution) fees */
    uint256 private reservedFeeBalance;
    /** IDs of pools ready for initiation */
    uint32[] private readyPoolIds;
    /** IDS of pools pending deposit confirmation */
    uint32[] private pendingPoolIds;
    /** IDs of pools staked */
    uint32[] private stakedPoolIds;
    /** Active pool count */
    uint256 private totalDeposits;
    /** Slashed pool count */
    uint256 private forcedExits;
    /** Exiting pool count */
    uint256 private requestedExits;
    /** Total fee percentage */
    uint32 private feePercent = 5;

    /*************/
    /* Modifiers */
    /*************/

    /**
     * @dev Validate the caller is the authorized pool
     */
    modifier onlyPool(uint32 poolId) {
        require(
            msg.sender == poolAddresses[poolId],
            "Not pool"
        );
        _;
    }

    /**
     * @dev Validate the caller is the manager oracle
     */
    modifier onlyOracle() {
        require(
            msg.sender == oracleAddress,
            "Not oracle"
        );
        _;
    }

    /**
     * @dev Validate the caller is the oracle or upkeep
     */
    modifier onlyOracleOrUpkeep() {
        require(
            msg.sender == oracleAddress || msg.sender == address(upkeep),
            "Not oracle or upkeep"
        );
        _;
    }

    /**
     * @dev Validate the caller is the registry
     */
    modifier onlyRegistry() {
        require(
            msg.sender == address(registry),
            "Not registry"
        );
        _;
    }

    /**
     * @dev Validate the caller is the upkeep contract
     */
    modifier onlyUpkeep() {
        require(
            msg.sender == address(upkeep),
            "Not upkeep"
        );
        _;
    }

    /**
     * @dev Validate a deposit
     */
    modifier validDeposit() {
        require(
            msg.value >= stakeMinimum,
            "Deposit less than minimum"
        );
        _;
    }

    /**
     * @dev Validate a withdrawal
     */
    modifier validWithdrawal(uint256 amount) {
        require(
            amount >= stakeMinimum,
            "Withdrawal less than minimum"
        );
        _;
    }

    /**
     * @dev Validate a distribution
     * @param amount The amount to validate
     */
    modifier validDistribution(uint256 amount) {
        require(amount > 0, "Distribution amount is zero");
        _;
    }
        
    /**
     * @notice Constructor
     * @param _oracleAddress The manager oracle address
     * @param beaconDepositAddress The Beacon deposit address
     * @param linkFunctionsAddress The Chainlink functions oracle address
     * @param linkRegistrarAddress The Chainlink keeper registrar address
     * @param linkRegistryAddress The Chainlink keeper registry address
     * @param linkTokenAddress The Chainlink token address
     * @param ssvNetworkAddress The SSV network address
     * @param ssvNetworkViewsAddress The SSV network views address
     * @param ssvTokenAddress The SSV token address
     * @param swapFactoryAddress The Uniswap factory address
     * @param swapRouterAddress The Uniswap router address
     * @param wethTokenAddress The WETH contract address
     */
    constructor(
        address _oracleAddress,
        address beaconDepositAddress,
        address linkFunctionsAddress,
        address linkRegistrarAddress,
        address linkRegistryAddress,
        address linkTokenAddress,
        address ssvNetworkAddress,
        address ssvNetworkViewsAddress,
        address ssvTokenAddress,
        address swapFactoryAddress,
        address swapRouterAddress,
        address wethTokenAddress
    ) {
        oracleAddress = _oracleAddress;
        beaconDeposit = IDepositContract(beaconDepositAddress);
        linkRegistrar = KeeperRegistrarInterface(linkRegistrarAddress);
        linkRegistry = AutomationRegistryInterface(linkRegistryAddress);
        linkToken = IERC20(linkTokenAddress);
        tokenAddresses[Token.LINK] = linkTokenAddress;
        ssvNetwork = ISSVNetwork(ssvNetworkAddress);
        tokenAddresses[Token.SSV] = ssvTokenAddress;
        ssvToken = IERC20(ssvTokenAddress);
        swapFactory = IUniswapV3Factory(swapFactoryAddress);
        swapRouter = ISwapRouter(swapRouterAddress);
        tokenAddresses[Token.WETH] = wethTokenAddress;

        registry = new CasimirRegistry(ssvNetworkViewsAddress);
        upkeep = new CasimirUpkeep(linkFunctionsAddress);
    }

    /**
     * @notice Receive and deposit validator tips
     */
    receive() external payable {
        tipBalance += msg.value;
        if (tipBalance >= compoundMinimum) {
            depositTips();
        }
    }

    /**
     * @notice Deposit user stake
     */
    function depositStake() external payable nonReentrant validDeposit {
        setActionCount(msg.sender);
        User storage user = users[msg.sender];
        uint256 depositAfterFees = subtractFees(msg.value);
        reservedFeeBalance += msg.value - depositAfterFees;

        if (user.stake0 > 0) {
            user.stake0 = getUserStake(msg.sender);
        }
        user.stakeRatioSum0 = stakeRatioSum;
        user.stake0 += depositAfterFees;

        distributeStake(depositAfterFees);

        emit StakeDeposited(msg.sender, depositAfterFees);
    }

    /**
     * @notice Deposit a given amount of rewards
     */
    function depositRewards() external payable {
        uint256 rewardsAfterFees = subtractFees(msg.value);
        reservedFeeBalance += msg.value - rewardsAfterFees;
        distributeStake(rewardsAfterFees);

        emit RewardsDeposited(rewardsAfterFees);
    }

    /**
     * @notice Deposit the current tip balance
     */
    function depositTips() private {
        uint256 tipsAfterFees = subtractFees(tipBalance);
        reservedFeeBalance += tipBalance - tipsAfterFees;
        tipBalance = 0;
        distributeStake(tipsAfterFees);

        emit TipsDeposited(tipsAfterFees);
    }

    /**
     * @notice Deposit exited balance from a given pool ID
     * @param poolId The pool ID
     */
    function depositExitedBalance(
        uint32 poolId
    ) external payable onlyPool(poolId) {
        delete poolAddresses[poolId];
        uint256 balance = msg.value + recoveredBalances[poolId];
        delete recoveredBalances[poolId];

        exitedBalance += balance;
        finalizableExitedBalance += balance;
        finalizableCompletedExits++;
    }

    /**
     * @notice Deposit recovered balance for a given pool from an operator
     * @param poolId The pool ID
     */
    function depositRecoveredBalance(
        uint32 poolId
    ) external payable onlyRegistry {
        recoveredBalances[poolId] += msg.value;
    }

    /**
     * @notice Deposit to a cluster balance
     * @param operatorIds The operator IDs
     * @param cluster The SSV cluster snapshot
     * @param feeAmount The fee amount to deposit
     * @param processed Whether the fee amount is already processed
     */
    function depositClusterBalance(
        uint64[] memory operatorIds,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 feeAmount,
        bool processed
    ) external onlyOracle {
        uint256 ssvAmount = retrieveFees(feeAmount, tokenAddresses[Token.SSV], processed);
        ssvToken.approve(address(ssvNetwork), ssvAmount);
        ssvNetwork.deposit(address(this), operatorIds, ssvAmount, cluster);
    }

    /**
     * @notice Deposit to the upkeep balance
     * @param feeAmount The fee amount to deposit
     * @param processed Whether the fee amount is already processed
     */
    function depositUpkeepBalance(
        uint256 feeAmount,
        bool processed
    ) external onlyOracleOrUpkeep {
        uint256 linkAmount = retrieveFees(feeAmount, tokenAddresses[Token.LINK], processed);
        linkToken.approve(address(linkRegistrar), linkAmount);
        if (upkeepId == 0) {
            if (linkAmount < upkeepRegistrationMinimum) {
                revert("Upkeep registration minimum not met");
            }
            upkeepId = linkRegistrar.registerUpkeep(
                KeeperRegistrarInterface.RegistrationParams({
                    name: string("CasimirV1Upkeep"),
                    encryptedEmail: new bytes(0),
                    upkeepContract: address(this),
                    gasLimit: 0,
                    adminAddress: address(this),
                    checkData: new bytes(0),
                    offchainConfig: new bytes(0),
                    amount: uint96(linkAmount)
                })
            );
        } else {
            linkRegistry.addFunds(upkeepId, uint96(linkAmount));
        }

        if (upkeepId == 0) {
            revert("Upkeep not registered");
        }
    }

    /**
     * @notice Deposit reserved fees
     */
    function depositReservedFees() external payable {
        reservedFeeBalance += msg.value;
    }

    /**
     * @notice Withdraw a given amount of reserved fees
     * @param amount The amount of fees to withdraw
     */
    function withdrawReservedFees(uint256 amount) external onlyOwner {
        require(
            amount <= reservedFeeBalance,
            "Withdrawing more than reserved"
        );
        reservedFeeBalance -= amount;
        owner().send(amount);
    }

    /**
     * @dev Distribute a given amount of stake
     * @param amount The amount of stake to distribute
     */
    function distributeStake(uint256 amount) private validDistribution(amount) {
        while (amount > 0) {
            uint256 remainingCapacity = poolCapacity - prepoolBalance;
            if (remainingCapacity > amount) {
                prepoolBalance += amount;
                amount = 0;
            } else {
                lastPoolId++;
                uint32 poolId = lastPoolId;
                prepoolBalance = 0;
                amount -= remainingCapacity;
                readyPoolIds.push(poolId);

                emit DepositRequested(poolId);
            }
        }
    }

    /**
     * @notice Rebalance the rewards to stake ratio and redistribute swept rewards
     * @param activeBalance The active balance
     * @param sweptBalance The swept balance
     * @param activatedDeposits The count of activated deposits
     * @param completedExits The count of withdrawn exits
     */
    function rebalanceStake(
        uint256 activeBalance,
        uint256 sweptBalance,
        uint256 activatedDeposits,
        uint256 completedExits
    ) external onlyUpkeep {
        uint256 expectedActivatedBalance = activatedDeposits * poolCapacity;
        uint256 expectedExitedBalance = completedExits * poolCapacity;
        int256 surplus = int256(activeBalance + sweptBalance) -
            (int256(getExpectedEffectiveBalance() + expectedExitedBalance));
        int256 rewards = surplus - int256(finalizableExitedBalance);
        int256 change = rewards - latestActiveRewardBalance;

        if (change > 0) {
            uint256 gain = uint256(change);
            if (rewards > 0) {
                uint256 gainAfterFees = subtractFees(gain);
                stakeRatioSum += Math.mulDiv(
                    stakeRatioSum,
                    gainAfterFees,
                    getTotalStake()
                );
                latestActiveBalanceAfterFees += gainAfterFees;

                emit StakeRebalanced(gainAfterFees);
            } else {
                stakeRatioSum += Math.mulDiv(
                    stakeRatioSum,
                    gain,
                    getTotalStake()
                );
                latestActiveBalanceAfterFees += gain;

                emit StakeRebalanced(gain);
            }
        } else if (change < 0) {
            uint256 loss = uint256(-change);
            stakeRatioSum -= Math.mulDiv(stakeRatioSum, loss, getTotalStake());
            latestActiveBalanceAfterFees -= loss;

            emit StakeRebalanced(loss);
        }

        uint256 sweptRewards = sweptBalance - finalizableExitedBalance;
        latestActiveRewardBalance = rewards - int256(sweptRewards);
        latestActiveBalance = activeBalance;
        latestActiveBalanceAfterFees += expectedActivatedBalance;
        latestActiveBalanceAfterFees -= subtractFees(sweptRewards);
        latestActiveBalanceAfterFees -= finalizableExitedBalance;

        reportPeriod++;
        finalizableExitedBalance = 0;
        finalizableCompletedExits = 0;
    }

    /**
     * @notice Compound rewards given a list of pool IDs
     * @param poolIds The list of pool IDs
     */
    function compoundRewards(uint32[5] memory poolIds) external onlyUpkeep {
        for (uint256 i = 0; i < poolIds.length; i++) {
            uint32 poolId = poolIds[i];
            if (poolId == 0) {
                break;
            }
            ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
            pool.depositRewards();
        }
    }

    /**
     * @notice Request to withdraw user stake
     * @param amount The amount of stake to withdraw
     */
    function requestWithdrawal(
        uint256 amount
    ) external nonReentrant validWithdrawal(amount) {
        setActionCount(msg.sender);
        User storage user = users[msg.sender];
        user.stake0 = getUserStake(msg.sender);
        require(
            user.stake0 >= amount,
            "Withdrawing more than user stake"
        );

        user.stakeRatioSum0 = stakeRatioSum;
        user.stake0 -= amount;

        if (amount <= getWithdrawableBalance()) {
            fulfillWithdrawal(msg.sender, amount);
        } else {
            requestedWithdrawalQueue.push(
                Withdrawal({
                    user: msg.sender,
                    amount: amount,
                    period: reportPeriod
                })
            );
            requestedWithdrawalBalance += amount;
            requestedWithdrawals++;

            uint256 coveredExitBalance = requestedExits * poolCapacity;
            if (requestedWithdrawalBalance > coveredExitBalance) {
                uint256 exitsRequired = (requestedWithdrawalBalance -
                    coveredExitBalance) / poolCapacity;
                if (
                    (requestedWithdrawalBalance - coveredExitBalance) %
                        poolCapacity >
                    0
                ) {
                    exitsRequired++;
                }
                requestExits(exitsRequired);
            }

            emit WithdrawalInitiated(msg.sender, amount);
        }
    }

    /**
     * @notice Fulfill a given count of pending withdrawals
     * @param count The number of withdrawals to complete
     */
    function fulfillWithdrawals(uint256 count) external onlyUpkeep {
        while (count > 0) {
            count--;

            if (requestedWithdrawalQueue.length == 0) {
                break;
            }

            Withdrawal memory withdrawal = requestedWithdrawalQueue[0];

            if (withdrawal.period > reportPeriod) {
                break;
            }

            requestedWithdrawalQueue.remove(0);
            requestedWithdrawalBalance -= withdrawal.amount;
            requestedWithdrawals--;

            fulfillWithdrawal(withdrawal.user, withdrawal.amount);
        }
    }

    /**
     * @notice Fulfill a withdrawal
     * @param sender The withdrawal sender
     * @param amount The withdrawal amount
     */
    function fulfillWithdrawal(address sender, uint256 amount) private {
        if (amount <= exitedBalance) {
            exitedBalance -= amount;
        } else {
            uint256 remainder = amount - exitedBalance;
            exitedBalance = 0;
            prepoolBalance -= remainder;
        }

        sender.send(amount);

        emit WithdrawalFulfilled(sender, amount);
    }

    /**
     * Check and set a user's action count
     * @param userAddress The user address to check
     */
    function setActionCount(address userAddress) private {
        User storage user = users[userAddress];
        require(
            user.actionPeriodTimestamp == 0 ||
            user.actionCount < maxActionsPerPeriod ||
            block.timestamp >= user.actionPeriodTimestamp + actionPeriod,
            "User action period maximum reached"
        );
        if (block.timestamp >= user.actionPeriodTimestamp + actionPeriod) {
            user.actionPeriodTimestamp = block.timestamp;
            user.actionCount = 1;
        } else {
            user.actionCount++;
        }
    }

    /**
     * @notice Initiate the next ready pool
     * @param depositDataRoot The deposit data root
     * @param publicKey The validator public key
     * @param signature The signature
     * @param withdrawalCredentials The withdrawal credentials
     * @param operatorIds The operator IDs
     * @param shares The operator shares
     * @param feeAmount The fee amount to deposit
     * @param cluster The SSV cluster snapshot
     */
    function initiateDeposit(
        bytes32 depositDataRoot,
        bytes memory publicKey,
        bytes memory signature,
        bytes memory withdrawalCredentials,
        uint64[] memory operatorIds,
        bytes memory shares,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 feeAmount,
        bool processed
    ) external onlyOracle {
        require(readyPoolIds.length > 0, "No ready pools");

        uint32 poolId = readyPoolIds[0];
        readyPoolIds.remove(0);
        pendingPoolIds.push(poolId);
        totalDeposits++;

        poolAddresses[poolId] = deployPool(
            poolId,
            publicKey,
            withdrawalCredentials,
            operatorIds
        );

        registerPool(
            poolId,
            depositDataRoot,
            publicKey,
            signature,
            withdrawalCredentials,
            operatorIds,
            shares,
            cluster,
            feeAmount,
            processed
        );

        emit DepositInitiated(poolId);
    }

    function deployPool(
        uint32 poolId,
        bytes memory publicKey,
        bytes memory withdrawalCredentials,
        uint64[] memory operatorIds
    ) private returns (address poolAddress) {
        ICasimirPool pool = new CasimirPool(
            address(registry),
            poolId,
            publicKey,
            operatorIds
        );
        poolAddress = address(pool);
        bytes memory computedWithdrawalCredentials = abi.encodePacked(
            bytes1(uint8(1)),
            bytes11(0),
            poolAddress
        );
        require(
            keccak256(computedWithdrawalCredentials) ==
            keccak256(withdrawalCredentials),
            "Invalid withdrawal credentials"
        );
    }

    function registerPool(
        uint32 poolId,
        bytes32 depositDataRoot,
        bytes memory publicKey,
        bytes memory signature,
        bytes memory withdrawalCredentials,
        uint64[] memory operatorIds,
        bytes memory shares,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 feeAmount,
        bool processed
    ) private {
        for (uint256 i = 0; i < operatorIds.length; i++) {
            registry.addOperatorPool(operatorIds[i], poolId);
        }

        beaconDeposit.deposit{value: poolCapacity}(
            publicKey,
            withdrawalCredentials,
            signature,
            depositDataRoot
        );

        uint256 ssvAmount = retrieveFees(feeAmount, tokenAddresses[Token.SSV], processed);
        ssvToken.approve(address(ssvNetwork), ssvAmount);
        ssvNetwork.registerValidator(
            publicKey,
            operatorIds,
            shares,
            ssvAmount,
            cluster
        );
    }

    /**
     * @notice Activate a given count of the next pending pools
     * @param count The number of pools to activate
     */
    function activateDeposits(uint256 count) external onlyUpkeep {
        require(pendingPoolIds.length >= count, "Not enough pending pools");

        while (count > 0) {
            count--;

            uint32 poolId = pendingPoolIds[0];
            pendingPoolIds.remove(0);
            stakedPoolIds.push(poolId);

            emit DepositActivated(poolId);
        }
    }

    /**
     * @notice Request a given count of staked pool exits
     * @param count The number of exits to request
     */
    function requestExits(uint256 count) private {
        uint256 index = 0;
        while (count > 0) {
            uint32 poolId = stakedPoolIds[index];
            ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);

            ICasimirPool.PoolStatus poolStatus = pool.getStatus();
            if (
                poolStatus == ICasimirPool.PoolStatus.PENDING ||
                poolStatus == ICasimirPool.PoolStatus.ACTIVE
            ) {
                count--;
                index++;

                pool.setStatus(ICasimirPool.PoolStatus.EXITING_REQUESTED);
                requestedExits++;

                emit ExitRequested(poolId);
            }
        }
    }

    /**
     * @notice Request reports for a given count of pools forced to exit
     * @param count The number of pools forced to exit
     */
    function requestForcedExitReports(uint256 count) external onlyUpkeep {
        requestedForcedExitReports = count;

        emit ForcedExitReportsRequested(count);
    }

    /**
     * @notice Request reports for a given count of completed exits
     * @param count The number of completed exits
     */
    function requestCompletedExitReports(uint256 count) external onlyUpkeep {
        requestedCompletedExitReports = count;

        emit CompletedExitReportsRequested(count);
    }

    /**
     * @notice Report pool forced (unrequested) exits
     * @param poolIds The pool IDs
     */
    function reportForcedExits(uint32[] memory poolIds) external onlyOracle {
        for (uint256 i = 0; i < poolIds.length; i++) {
            require(
                requestedForcedExitReports > 0,
                "No requested forced exits"
            );

            uint32 poolId = poolIds[i];
            ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
            ICasimirPool.PoolStatus poolStatus = pool.getStatus();
            require(
                poolStatus != ICasimirPool.PoolStatus.EXITING_FORCED,
                "Forced exit already reported"
            );

            requestedForcedExitReports -= 1;
            forcedExits++;
            if (poolStatus == ICasimirPool.PoolStatus.EXITING_REQUESTED) {
                requestedExits--;
            }
            pool.setStatus(ICasimirPool.PoolStatus.EXITING_FORCED);
        }
    }

    /**
     * @notice Report a completed exit
     * @param poolIndex The staked pool index
     * @param blamePercents The operator blame percents (0 if balance is 32 ether)
     * @param cluster The SSV cluster snapshot
     */
    function reportCompletedExit(
        uint256 poolIndex,
        uint32[] memory blamePercents,
        ISSVNetworkCore.Cluster memory cluster
    ) external onlyOracle {
        require(
            requestedCompletedExitReports > 0,
            "No requested pool withdrawn exit reports"
        );
        uint32 poolId = stakedPoolIds[poolIndex];
        ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
        ICasimirPool.PoolConfig memory poolConfig = pool.getConfig();
        require(
            poolConfig.status == ICasimirPool.PoolStatus.EXITING_FORCED ||
                poolConfig.status == ICasimirPool.PoolStatus.EXITING_REQUESTED,
            "Pool not exiting"
        );

        requestedCompletedExitReports -= 1;
        stakedPoolIds.remove(poolIndex);
        uint64[] memory operatorIds = poolConfig.operatorIds;
        bytes memory publicKey = poolConfig.publicKey;

        totalDeposits--;
        if (poolConfig.status == ICasimirPool.PoolStatus.EXITING_REQUESTED) {
            requestedExits--;
        } else if (
            poolConfig.status == ICasimirPool.PoolStatus.EXITING_FORCED
        ) {
            forcedExits--;
        }
        pool.setStatus(ICasimirPool.PoolStatus.WITHDRAWN);
        pool.withdrawBalance(blamePercents);

        ssvNetwork.removeValidator(publicKey, operatorIds, cluster);

        emit ExitCompleted(poolId);
    }

    /**
     * @notice Report a reshare
     * @param poolId The pool ID
     * @param operatorIds The operator IDs
     * @param oldOperatorIds The old operator IDs
     * @param newOperatorId The new operator ID
     * @param oldOperatorId The old operator ID
     * @param shares The operator shares
     * @param cluster The SSV cluster snapshot
     * @param oldCluster The old SSV cluster snapshot
     * @param feeAmount The fee amount to deposit
     * @param processed Whether the fee amount is already processed
     */
    function reportReshare(
        uint32 poolId,
        uint64[] memory operatorIds,
        uint64[] memory oldOperatorIds,
        uint64 newOperatorId,
        uint64 oldOperatorId,
        bytes memory shares,
        ISSVNetworkCore.Cluster memory cluster,
        ISSVNetworkCore.Cluster memory oldCluster,
        uint256 feeAmount,
        bool processed
    ) external onlyOracle {
        ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
        ICasimirPool.PoolConfig memory poolConfig = pool.getConfig();
        require(
            poolConfig.status == ICasimirPool.PoolStatus.PENDING ||
            poolConfig.status == ICasimirPool.PoolStatus.ACTIVE,
            "Pool not active"
        );
        require(
            poolConfig.reshares < 2,
            "Pool already reshared twice"
        );

        pool.setReshares(poolConfig.reshares + 1);

        registry.removeOperatorPool(oldOperatorId, poolId, 0);
        registry.addOperatorPool(newOperatorId, poolId);

        uint256 ssvAmount = retrieveFees(feeAmount, tokenAddresses[Token.SSV], processed);
        ssvToken.approve(address(ssvNetwork), ssvAmount);

        ssvNetwork.removeValidator(
            poolConfig.publicKey,
            oldOperatorIds,
            oldCluster
        );

        ssvNetwork.registerValidator(
            poolConfig.publicKey,
            operatorIds,
            shares,
            ssvAmount,
            cluster
        );
    }

    /**
     * @dev Get reservable fees from a given amount
     * @param amount The amount to reserve fees from
     * @return amountAfterFees The amount after fees
     */
    function subtractFees(
        uint256 amount
    ) private view returns (uint256 amountAfterFees) {
        amountAfterFees = Math.mulDiv(amount, 100, 100 + feePercent);
    }

    /**
     * @dev Retrieve fees for a given amount of a given token
     * @param amount The amount to retrieve
     * @param token The token address
     * @param processed Whether the amount is already processed
     */
    function retrieveFees(
        uint256 amount,
        address token,
        bool processed
    ) private returns (uint256 amountOut) {
        if (!processed) {
            amountOut = processFees(amount, token);
        } else {
            amountOut = amount;
        }
    }

    /**
     * @dev Process reserved fees to a given token
     * @param amount The amount to process
     * @param tokenOut The output token address
     * @return amountOut The output token amount out
     */
    function processFees(
        uint256 amount,
        address tokenOut
    ) private returns (uint256 amountOut) {
        reservedFeeBalance -= amount;
        IWETH9 wethToken = IWETH9(tokenAddresses[Token.WETH]);
        wethToken.deposit{value: amount}();
        wethToken.approve(
            address(swapRouter),
            wethToken.balanceOf(address(this))
        );

        IUniswapV3PoolState swapPool = IUniswapV3PoolState(
            swapFactory.getPool(
                tokenAddresses[Token.WETH],
                tokenOut,
                uniswapFeeTier
            )
        );
        uint256 liquidity = swapPool.liquidity();
        require(liquidity >= amount, "Not enough liquidity");

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenAddresses[Token.WETH],
                tokenOut: tokenOut,
                fee: uniswapFeeTier,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
        amountOut = swapRouter.exactInputSingle(params);
    }

    /**
     * @notice Withdraw a given amount of a cluster balance
     * @param operatorIds The operator IDs
     * @param cluster The SSV cluster snapshot
     * @param amount The amount to withdraw
     */
    function withdrawClusterBalance(
        uint64[] memory operatorIds,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 amount
    ) private {
        ssvNetwork.withdraw(operatorIds, amount, cluster);
    }

    /**
     * @notice Cancel upkeep and withdraw the upkeep balance
     */
    function withdrawUpkeepBalance() external onlyOracle {
        linkRegistry.cancelUpkeep(upkeepId);
    }

    /**
     * @notice Withdraw a given amount from the LINK balance
     * @param amount The amount to withdraw
     */
    function withdrawLINKBalance(uint256 amount) external onlyOwner {
        linkToken.transfer(owner(), amount);
    }

    /**
     * @notice Withdraw a given amount from the SSV balance
     * @param amount The amount to withdraw
     */
    function withdrawSSVBalance(uint256 amount) external onlyOwner {
        ssvToken.transfer(owner(), amount);
    }

    /**
     * @notice Update the functions oracle address
     * @param functionsAddress New functions oracle address
     */
    function setFunctionsAddress(address functionsAddress) external onlyOwner {
        upkeep.setOracleAddress(functionsAddress);
    }

    /**
     * @notice Get the total user stake for a given user address
     * @param userAddress The user address
     * @return userStake The total user stake
     */
    function getUserStake(
        address userAddress
    ) public view returns (uint256 userStake) {
        userStake = Math.mulDiv(
            users[userAddress].stake0,
            stakeRatioSum,
            users[userAddress].stakeRatioSum0
        );
    }

    /**
     * @notice Get the total stake
     * @return totalStake The total stake
     */
    function getTotalStake() public view returns (uint256 totalStake) {
        totalStake =
            getBufferedBalance() +
            latestActiveBalanceAfterFees -
            requestedWithdrawalBalance;
    }

    /**
     * @notice Get the buffered balance
     * @return bufferedBalance The buffered balance
     */
    function getBufferedBalance()
        public
        view
        returns (uint256 bufferedBalance)
    {
        bufferedBalance = getWithdrawableBalance() + getReadyBalance();
    }

    /**
     * @notice Get the ready balance
     * @return readyBalance The ready balance
     */
    function getReadyBalance() public view returns (uint256 readyBalance) {
        readyBalance = readyPoolIds.length * poolCapacity;
    }

    /**
     * @notice Get the withdrawable balanace
     * @return withdrawableBalance The withdrawable balanace
     */
    function getWithdrawableBalance() public view returns (uint256) {
        return prepoolBalance + exitedBalance;
    }

    /**
     * @notice Get the reserved fee balance
     * @return reservedFeeBalance The reserved fee balance
     */
    function getReservedFeeBalance() public view returns (uint256) {
        return reservedFeeBalance;
    }

    /**
     * @notice Get the expected effective balance
     * @return expectedEffectiveBalance The expected effective balance
     */
    function getExpectedEffectiveBalance()
        public
        view
        returns (uint256 expectedEffectiveBalance)
    {
        expectedEffectiveBalance = stakedPoolIds.length * poolCapacity;
    }

    /**
     * @notice Get the latest active balance
     * @return latestActiveBalance The latest active balance
     */
    function getLatestActiveBalance() public view returns (uint256) {
        return latestActiveBalance;
    }

    /**
     * @notice Get the latest active balance after fees
     * @return latestActiveBalanceAfterFees The latest active balance after fees
     */
    function getLatestActiveBalanceAfterFees() public view returns (uint256) {
        return latestActiveBalanceAfterFees;
    }

    /**
     * @notice Get the finalizable completed exit count of the current reporting period
     * @return finalizableCompletedExits The finalizable completed exit count of the current reporting period
     */
    function getFinalizableCompletedExits() public view returns (uint256) {
        return finalizableCompletedExits;
    }

    /**
     * @notice Get the report period
     * @return reportPeriod The report period
     */
    function getReportPeriod() public view returns (uint256) {
        return reportPeriod;
    }

    /**
     * @notice Get the eligibility of a pending withdrawal
     * @param index The index of the pending withdrawal
     * @param period The period to check
     * @return pendingWithdrawalEligibility The eligibility of a pending withdrawal
     */
    function getPendingWithdrawalEligibility(uint256 index, uint256 period) public view returns (bool) {
        if (requestedWithdrawals > index) {
            return requestedWithdrawalQueue[index].period <= period;
        }
        return false;
    }

    /**
     * @notice Get the total pending user withdrawal amount
     * @return requestedWithdrawalBalance The total pending user withdrawal amount
     */
    function getPendingWithdrawalBalance() public view returns (uint256) {
        return requestedWithdrawalBalance;
    }

    /**
     * @notice Get the total pending withdrawal count
     * @return requestedWithdrawals The total pending withdrawal count
     */
    function getPendingWithdrawals() public view returns (uint256) {
        return requestedWithdrawals;
    }

    /**
     * @notice Get the total fee percentage
     * @return feePercent The total fee percentage
     */
    function getFeePercent() public view returns (uint32) {
        return feePercent;
    }

    /**
     * @notice Get the count of pools requested to exit
     * @return requestedExits The count of pools requested to exit
     */
    function getRequestedExits() external view returns (uint256) {
        return requestedExits;
    }

    /**
     * @notice Get the ready pool IDs
     * @return readyPoolIds The ready pool IDs
     */
    function getReadyPoolIds() external view returns (uint32[] memory) {
        return readyPoolIds;
    }

    /**
     * @notice Get the pending pool IDs
     * @return pendingPoolIds The pending pool IDs
     */
    function getPendingPoolIds() external view returns (uint32[] memory) {
        return pendingPoolIds;
    }

    /**
     * @notice Get the staked pool IDs
     * @return stakedPoolIds The staked pool IDs
     */
    function getStakedPoolIds() external view returns (uint32[] memory) {
        return stakedPoolIds;
    }

    /**
     * @notice Get the pre-pool balance
     * @return prepoolBalance The pre-pool balance
     */
    function getPrepoolBalance() external view returns (uint256) {
        return prepoolBalance;
    }

    /**
     * @notice Get a pool's address by ID
     * @param poolId The pool ID
     * @return poolAddress The pool address
     */
    function getPoolAddress(uint32 poolId) external view returns (address) {
        return poolAddresses[poolId];
    }

    /**
     * @notice Get a pool's details by ID
     * @param poolId The pool ID
     * @return poolDetails The pool details
     */
    function getPoolDetails(
        uint32 poolId
    ) external view returns (PoolDetails memory poolDetails) {
        if (poolAddresses[poolId] != address(0)) {
            ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
            ICasimirPool.PoolConfig memory poolConfig = pool.getConfig();
            poolDetails = PoolDetails({
                id: poolId,
                balance: pool.getBalance(),
                publicKey: poolConfig.publicKey,
                operatorIds: poolConfig.operatorIds,
                status: poolConfig.status
            });
        }
    }

    /**
     * @notice Get the registry address
     * @return registryAddress The registry address
     */
    function getRegistryAddress()
        external
        view
        returns (address registryAddress)
    {
        registryAddress = address(registry);
    }

    /**
     * @notice Get the upkeep ID
     * @return upkeepId The upkeep ID
     */
    function getUpkeepId() external view returns (uint256) {
        return upkeepId;
    }

    /**
     * @notice Get the upkeep address
     * @return upkeepAddress The upkeep address
     */
    function getUpkeepAddress() external view returns (address upkeepAddress) {
        upkeepAddress = address(upkeep);
    }

    /**
     * @notice Get the upkeep balance
     * @return upkeepBalance The upkeep balance
     */
    function getUpkeepBalance() external view returns (uint256 upkeepBalance) {
        upkeepBalance = linkRegistry.getUpkeep(upkeepId).balance;
    }
}