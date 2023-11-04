// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "../CasimirCore.sol";
import "../interfaces/ICasimirFactory.sol";
import "./interfaces/ICasimirManagerDev.sol";
import "../interfaces/ICasimirPool.sol";
import "../interfaces/ICasimirRegistry.sol";
import "../interfaces/ICasimirUpkeep.sol";
import "../libraries/CasimirArray.sol";
import "../libraries/CasimirBeacon.sol";
import "../vendor/interfaces/ISSVNetwork.sol";
import "../vendor/interfaces/IWETH9.sol";
import "../vendor/interfaces/IFunctionsBillingRegistry.sol";
import "../vendor/interfaces/IKeeperRegistrar.sol";
import "../vendor/interfaces/IAutomationRegistry.sol";
import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@openzeppelin/contracts-upgradeable/proxy/beacon/IBeaconUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-core/contracts/interfaces/pool/IUniswapV3PoolState.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

/// @title Manager that accepts and distributes deposits
contract CasimirManagerDev is
    ICasimirManagerDev,
    CasimirCore,
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using CasimirArray for uint32[];
    using CasimirArray for bytes[];
    using CasimirArray for Withdrawal[];

    /// @inheritdoc ICasimirManagerDev
    uint256 public lockPeriod;
    /// @inheritdoc ICasimirManagerDev
    uint32 public userFee;
    /// @inheritdoc ICasimirManagerDev
    bool public eigenStake;
    /// @inheritdoc ICasimirManagerDev
    bool public liquidStake;
    /// @inheritdoc ICasimirManagerDev
    uint32 public reportPeriod;
    /// @inheritdoc ICasimirManagerDev
    uint64 public functionsId;
    /// @inheritdoc ICasimirManagerDev
    uint256 public upkeepId;
    /// @inheritdoc ICasimirManagerDev
    uint256 public latestBeaconBalance;
    /// @inheritdoc ICasimirManagerDev
    uint256 public finalizableActivations;
    /// @inheritdoc ICasimirManagerDev
    uint256 public finalizableCompletedExits;
    /// @inheritdoc ICasimirManagerDev
    uint256 public requestedWithdrawalBalance;
    /// @inheritdoc ICasimirManagerDev
    uint256 public reservedFeeBalance;
    /// @inheritdoc ICasimirManagerDev
    uint256 public requestedExits;
    /**
     * @dev Chainlink functions billing registry contract
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    IFunctionsBillingRegistry private immutable functionsBillingRegistry;
    /**
     * @dev LINK ERC-20 token contract
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    LinkTokenInterface private immutable linkToken;
    /**
     * @dev Keeper registrar contract
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    IKeeperRegistrar private immutable keeperRegistrar;
    /**
     * @dev Automation registry contract
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    IAutomationRegistry private immutable keeperRegistry;
    /**
     * @dev SSV clusters contract
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    ISSVClusters private immutable ssvClusters;
    /**
     * @dev SSV ERC-20 token contract
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    IERC20Upgradeable private immutable ssvToken;
    /**
     * @dev Uniswap factory contract
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    IUniswapV3Factory private immutable swapFactory;
    /**
     * @dev Uniswap router contract
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    ISwapRouter private immutable swapRouter;
    /**
     * @dev WETH9 ERC-20 token contract
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    IWETH9 private immutable wethToken;
    /// @dev Compound minimum (0.1 ETH)
    uint256 private constant COMPOUND_MINIMUM = 100000000 gwei;
    /// @dev Scale factor for each rewards to stake ratio
    uint256 private constant SCALE_FACTOR = 1 ether;
    /// @dev Uniswap 0.3% fee tier
    uint24 private constant UNISWAP_FEE_TIER = 3000;
    /// @dev Pool capacity
    uint256 private constant POOL_CAPACITY = 32 ether;
    /// @dev DAO oracle address
    address private daoOracleAddress;
    /// @dev Factory contract
    ICasimirFactory private factory;
    /// @dev Registry contract
    ICasimirRegistry private registry;
    /// @dev Upkeep contract
    ICasimirUpkeep private upkeep;
    /// @dev Last pool ID created
    uint32 private lastPoolId;
    /// @dev Latest beacon chain balance after fees
    uint256 private latestBeaconBalanceAfterFees;
    /// @dev Latest active rewards
    int256 private latestActiveRewardBalance;
    /// @dev Report finalizable exited balance
    uint256 private finalizableExitedBalance;
    /// @dev Report finalizable recovered balance
    uint256 private finalizableRecoveredBalance;
    /// @dev All users
    mapping(address => User) private users;
    /// @dev Sum of scaled rewards to balance ratios
    uint256 private stakeRatioSum;
    /// @dev Total pending withdrawals count
    uint256 private requestedWithdrawals;
    /// @dev Pending withdrawals
    Withdrawal[] private requestedWithdrawalQueue;
    /// @dev All pool addresses
    mapping(uint32 => address) private poolAddresses;
    /// @dev Validator tip balance
    uint256 private tipBalance;
    /// @dev Pool recovered balances
    mapping(uint32 => uint256) private recoveredBalances;
    /// @dev Total deposits not yet in pools
    uint256 private prepoolBalance;
    /// @dev Total exited deposits
    uint256 private exitedBalance;
    /// @dev IDs of pools ready for initiation
    uint32[] private readyPoolIds;
    /// @dev IDS of pools pending deposit confirmation
    uint32[] private pendingPoolIds;
    /// @dev IDs of pools staked
    uint32[] private stakedPoolIds;
    /// @dev Slashed pool count
    uint256 private forcedExits;
    /// @dev Whether the contract is paused
    bool private paused;
    /// @dev Storage gap
    uint256[49] private __gap;

    /**
     * @dev Constructor
     * @param functionsBillingRegistry_ Chainlink functions billing registry contract
     * @param keeperRegistrar_ Chainlink keeper registrar contract
     * @param keeperRegistry_ Chainlink keeper registry contract
     * @param linkToken_ Chainlink token contract
     * @param ssvNetwork_ SSV network contract
     * @param ssvToken_ SSV token contract
     * @param swapFactory_ Uniswap factory contract
     * @param swapRouter_ Uniswap router contract
     * @param wethToken_ WETH9 token contract
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(
        IFunctionsBillingRegistry functionsBillingRegistry_,
        IKeeperRegistrar keeperRegistrar_,
        IAutomationRegistry keeperRegistry_,
        LinkTokenInterface linkToken_,
        ISSVClusters ssvNetwork_,
        IERC20Upgradeable ssvToken_,
        IUniswapV3Factory swapFactory_,
        ISwapRouter swapRouter_,
        IWETH9 wethToken_
    ) {
        onlyAddress(address(functionsBillingRegistry_));
        onlyAddress(address(keeperRegistrar_));
        onlyAddress(address(keeperRegistry_));
        onlyAddress(address(linkToken_));
        onlyAddress(address(ssvNetwork_));
        onlyAddress(address(ssvToken_));
        onlyAddress(address(swapFactory_));
        onlyAddress(address(swapRouter_));
        onlyAddress(address(wethToken_));
        functionsBillingRegistry = functionsBillingRegistry_;
        keeperRegistrar = keeperRegistrar_;
        keeperRegistry = keeperRegistry_;
        linkToken = linkToken_;
        ssvClusters = ssvNetwork_;
        ssvToken = ssvToken_;
        swapFactory = swapFactory_;
        swapRouter = swapRouter_;
        wethToken = wethToken_;
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param daoOracleAddress_ DAO oracle address
     * @param functionsOracleAddress Chainlink functions oracle address
     * @param strategy Staking strategy configuration
     */
    function initialize(
        address daoOracleAddress_,
        address functionsOracleAddress,
        Strategy memory strategy
    ) public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        daoOracleAddress = daoOracleAddress_;
        factory = ICasimirFactory(msg.sender);
        registry = ICasimirRegistry(
            CasimirBeacon.createRegistry(
                factory.registryBeaconAddress(),
                strategy.minCollateral,
                strategy.privateOperators,
                strategy.verifiedOperators
            )
        );
        upkeep = ICasimirUpkeep(
            CasimirBeacon.createUpkeep(
                factory.upkeepBeaconAddress(),
                msg.sender,
                functionsOracleAddress,
                strategy.compoundStake
            )
        );
        userFee = strategy.userFee;
        eigenStake = strategy.eigenStake;
        liquidStake = strategy.liquidStake;
        stakeRatioSum = 1000 ether;
    }

    /// @notice Receive and deposit validator tips
    receive() external payable {
        tipBalance += msg.value;
        if (tipBalance >= COMPOUND_MINIMUM) {
            depositTips();
        }
    }

    /// @inheritdoc ICasimirManagerDev
    function setPaused(bool paused_) external {
        onlyFactoryOwner();
        paused = paused_;
    }

    /// @inheritdoc ICasimirManagerDev
    function depositStake() external payable nonReentrant {
        onlyUnpaused();
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

    /// @inheritdoc ICasimirManagerDev
    function depositRewards(uint32 poolId) external payable {
        if (msg.value == 0) {
            revert InvalidAmount();
        }
        onlyPool(poolAddresses[poolId]);
        uint256 rewardsAfterFees = subtractFees(msg.value);
        reservedFeeBalance += msg.value - rewardsAfterFees;
        distributeStake(rewardsAfterFees);
        emit RewardsDeposited(rewardsAfterFees);
    }

    /// @inheritdoc ICasimirManagerDev
    function depositExitedBalance(uint32 poolId) external payable {
        onlyPool(poolAddresses[poolId]);
        uint256 balance = msg.value + recoveredBalances[poolId];
        delete recoveredBalances[poolId];
        delete poolAddresses[poolId];
        exitedBalance += balance;
        finalizableExitedBalance += balance;
        finalizableCompletedExits++;
        emit ExitedBalanceDeposited(poolId, msg.value);
    }

    /// @inheritdoc ICasimirManagerDev
    function depositRecoveredBalance(uint32 poolId) external payable {
        if (msg.sender != address(registry)) {
            revert Unauthorized();
        }
        recoveredBalances[poolId] += msg.value;
        finalizableRecoveredBalance += msg.value;
        emit RecoveredBalanceDeposited(poolId, msg.value);
    }

    /// @inheritdoc ICasimirManagerDev
    function depositClusterBalance(
        uint64[] memory operatorIds,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 feeAmount,
        uint256 minTokenAmount,
        bool processed
    ) external {
        onlyOracle();
        uint256 ssvAmount = retrieveFees(feeAmount, minTokenAmount, address(ssvToken), processed);
        ssvToken.approve(address(ssvClusters), ssvAmount);
        ssvClusters.deposit(address(this), operatorIds, ssvAmount, cluster);
        emit ClusterBalanceDeposited(ssvAmount);
    }

    /// @inheritdoc ICasimirManagerDev
    function depositFunctionsBalance(uint256 feeAmount, uint256 minTokenAmount, bool processed) external {
        onlyOracle();
        uint256 linkAmount = retrieveFees(feeAmount, minTokenAmount, address(linkToken), processed);
        if (functionsId == 0) {
            functionsId = functionsBillingRegistry.createSubscription();
            functionsBillingRegistry.addConsumer(functionsId, address(upkeep));
        }
        if (!linkToken.transferAndCall(address(functionsBillingRegistry), linkAmount, abi.encode(functionsId))) {
            revert TransferFailed();
        }
        emit FunctionsBalanceDeposited(linkAmount);
    }

    /// @inheritdoc ICasimirManagerDev
    function depositUpkeepBalance(uint256 feeAmount, uint256 minTokenAmount, bool processed) external {
        onlyOracle();
        uint256 linkAmount = retrieveFees(feeAmount, minTokenAmount, address(linkToken), processed);
        linkToken.approve(address(keeperRegistrar), linkAmount);
        if (upkeepId == 0) {
            upkeepId = keeperRegistrar.registerUpkeep(
                IKeeperRegistrar.RegistrationParams({
                    name: string("CasimirV1Upkeep"),
                    encryptedEmail: new bytes(0),
                    upkeepContract: address(upkeep),
                    gasLimit: 5000000,
                    adminAddress: address(this),
                    checkData: new bytes(0),
                    offchainConfig: new bytes(0),
                    amount: uint96(linkAmount)
                })
            );
        } else {
            keeperRegistry.addFunds(upkeepId, uint96(linkAmount));
        }
        emit UpkeepBalanceDeposited(linkAmount);
    }

    /// @inheritdoc ICasimirManagerDev
    function depositReservedFees() external payable {
        onlyFactoryOwner();
        reservedFeeBalance += msg.value;
        emit ReservedFeesDeposited(msg.value);
    }

    /// @inheritdoc ICasimirManagerDev
    function withdrawReservedFees(uint256 amount) external {
        onlyFactoryOwner();
        if (amount > reservedFeeBalance) {
            revert InvalidAmount();
        }
        reservedFeeBalance -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }
        emit ReservedFeesWithdrawn(amount);
    }

    /// @inheritdoc ICasimirManagerDev
    function rebalanceStake(
        uint256 beaconBalance,
        uint256 sweptBalance,
        uint256 activatedDeposits,
        uint256 completedExits
    ) external {
        onlyUpkeep();
        reportPeriod++;
        uint256 expectedActivatedBalance = activatedDeposits * POOL_CAPACITY;
        uint256 expectedExitedBalance = completedExits * POOL_CAPACITY;
        uint256 expectedEffectiveBalance = stakedPoolIds.length * POOL_CAPACITY;
        int256 rewards = int256(beaconBalance + sweptBalance + finalizableRecoveredBalance) -
            int256(expectedEffectiveBalance + expectedExitedBalance);
        int256 change = rewards - latestActiveRewardBalance;
        uint256 absoluteChange = change > 0 ? uint256(change) : uint256(-change);
        if (absoluteChange > (stakedPoolIds.length * POOL_CAPACITY) / 2) {
            revert InvalidRebalance();
        }
        if (latestBeaconBalanceAfterFees > 0) {
            if (change > 0) {
                uint256 gain = uint256(change);
                if (rewards > 0) {
                    uint256 gainAfterFees = subtractFees(gain);
                    stakeRatioSum += MathUpgradeable.mulDiv(stakeRatioSum, gainAfterFees, getTotalStake());
                    latestBeaconBalanceAfterFees += gainAfterFees;
                    emit StakeRebalanced(gainAfterFees);
                } else {
                    stakeRatioSum += MathUpgradeable.mulDiv(stakeRatioSum, gain, getTotalStake());
                    latestBeaconBalanceAfterFees += gain;
                    emit StakeRebalanced(gain);
                }
            } else if (change < 0) {
                uint256 loss = uint256(-change);
                stakeRatioSum -= MathUpgradeable.mulDiv(stakeRatioSum, loss, getTotalStake());
                latestBeaconBalanceAfterFees -= loss;
                emit StakeRebalanced(loss);
            }
            int256 sweptRewards = int256(sweptBalance + finalizableRecoveredBalance) - int256(finalizableExitedBalance);
            if (sweptRewards > 0) {
                latestBeaconBalanceAfterFees -= subtractFees(uint256(sweptRewards));
            }
            latestBeaconBalanceAfterFees -= finalizableExitedBalance;
            latestActiveRewardBalance = rewards - sweptRewards;
        }
        latestBeaconBalanceAfterFees += expectedActivatedBalance;
        latestBeaconBalance = beaconBalance;
        finalizableExitedBalance = 0;
        finalizableRecoveredBalance = 0;
        finalizableActivations = 0;
        finalizableCompletedExits = 0;
    }

    /// @inheritdoc ICasimirManagerDev
    function unbalanceStake(int256 rebalance) external {
        onlyFactoryOwner();
        if (rebalance > 0) {
            stakeRatioSum += uint256(rebalance);
        } else if (rebalance < 0) {
            stakeRatioSum -= uint256(-rebalance);
        }
    }

    /// @inheritdoc ICasimirManagerDev
    function setLatestBeaconBalanceAfterFees(uint256 latestBeaconBalanceAfterFees_) external {
        onlyFactoryOwner();
        latestBeaconBalanceAfterFees = latestBeaconBalanceAfterFees_;
    }

    /// @inheritdoc ICasimirManagerDev
    function compoundRewards(uint32[5] memory poolIds) external {
        onlyUpkeep();
        for (uint256 i; i < poolIds.length; i++) {
            uint32 poolId = poolIds[i];
            if (poolId == 0) {
                break;
            }
            ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
            pool.depositRewards();
        }
    }

    /// @inheritdoc ICasimirManagerDev
    function requestWithdrawal(uint256 amount) external nonReentrant {
        onlyUnpaused();
        User storage user = users[msg.sender];
        user.stake0 = getUserStake(msg.sender);
        if (user.stake0 < amount) {
            revert InvalidAmount();
        }
        user.stakeRatioSum0 = stakeRatioSum;
        user.stake0 -= amount;
        if (amount <= getWithdrawableBalance()) {
            if (amount <= exitedBalance) {
                exitedBalance -= amount;
            } else {
                uint256 remainder = amount - exitedBalance;
                exitedBalance = 0;
                prepoolBalance -= remainder;
            }
            fulfillWithdrawal(msg.sender, amount);
        } else {
            requestedWithdrawalQueue.push(Withdrawal({userAddress: msg.sender, amount: amount, period: reportPeriod}));
            requestedWithdrawalBalance += amount;
            requestedWithdrawals++;
            uint256 coveredExitBalance = requestedExits * POOL_CAPACITY;
            if (requestedWithdrawalBalance > coveredExitBalance) {
                uint256 exitsRequired = (requestedWithdrawalBalance - coveredExitBalance) / POOL_CAPACITY;
                if ((requestedWithdrawalBalance - coveredExitBalance) % POOL_CAPACITY > 0) {
                    exitsRequired++;
                }
                requestExits(exitsRequired);
            }
            emit WithdrawalInitiated(msg.sender, amount);
        }
    }

    /// @inheritdoc ICasimirManagerDev
    function fulfillWithdrawals(uint256 count) external {
        onlyUpkeep();
        uint256 withdrawalAmount;
        uint256 withdrawalCount;
        while (count > 0) {
            count--;
            if (requestedWithdrawalQueue.length == 0) {
                break;
            }
            Withdrawal memory withdrawal = requestedWithdrawalQueue[0];
            if (withdrawal.period > reportPeriod) {
                break;
            }
            requestedWithdrawalQueue.removeWithdrawalItem(0);
            withdrawalAmount += withdrawal.amount;
            withdrawalCount++;
            fulfillWithdrawal(withdrawal.userAddress, withdrawal.amount);
        }
        if (withdrawalAmount <= exitedBalance) {
            exitedBalance -= withdrawalAmount;
        } else {
            uint256 remainder = withdrawalAmount - exitedBalance;
            exitedBalance = 0;
            prepoolBalance -= remainder;
        }
        requestedWithdrawalBalance -= withdrawalAmount;
        requestedWithdrawals -= withdrawalCount;
    }

    /// @inheritdoc ICasimirManagerDev
    function initiatePool(
        bytes32 depositDataRoot,
        bytes memory publicKey,
        bytes memory signature,
        bytes memory withdrawalCredentials,
        uint64[] memory operatorIds,
        bytes memory shares
    ) external {
        onlyOracle();
        if (readyPoolIds.length == 0) {
            revert NoReadyPools();
        }
        uint32 poolId = readyPoolIds[0];
        readyPoolIds.removeUint32Item(0);
        pendingPoolIds.push(poolId);
        poolAddresses[poolId] = CasimirBeacon.createPool(
            factory.poolBeaconAddress(),
            address(registry),
            operatorIds,
            poolId,
            publicKey,
            shares
        );
        {
            ICasimirPool(poolAddresses[poolId]).depositStake{value: POOL_CAPACITY}(
                depositDataRoot,
                signature,
                withdrawalCredentials
            );
            for (uint256 i; i < operatorIds.length; i++) {
                registry.addOperatorPool(operatorIds[i], poolId);
            }
        }
        emit PoolInitiated(poolId);
    }

    /// @inheritdoc ICasimirManagerDev
    function activatePool(
        uint256 pendingPoolIndex,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 feeAmount,
        uint256 minTokenAmount,
        bool processed
    ) external {
        onlyOracle();
        uint32 poolId = pendingPoolIds[pendingPoolIndex];
        ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
        PoolRegistration memory poolRegistration = pool.getRegistration();
        if (poolRegistration.status != PoolStatus.PENDING) {
            revert PoolNotPending();
        }
        finalizableActivations++;
        pool.setStatus(PoolStatus.ACTIVE);
        uint256 ssvAmount = retrieveFees(feeAmount, minTokenAmount, address(ssvToken), processed);
        ssvToken.approve(address(ssvClusters), ssvAmount);
        ssvClusters.registerValidator(
            poolRegistration.publicKey,
            poolRegistration.operatorIds,
            poolRegistration.shares,
            ssvAmount,
            cluster
        );
        pendingPoolIds.removeUint32Item(pendingPoolIndex);
        stakedPoolIds.push(poolId);
        emit PoolActivated(poolId);
    }

    /// @inheritdoc ICasimirManagerDev
    function resharePool(
        uint32 poolId,
        uint64[] memory operatorIds,
        uint64 newOperatorId,
        uint64 oldOperatorId,
        bytes memory shares,
        ISSVNetworkCore.Cluster memory cluster,
        ISSVNetworkCore.Cluster memory oldCluster,
        uint256 feeAmount,
        uint256 minTokenAmount,
        bool processed
    ) external {
        onlyOracle();
        ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
        PoolStatus poolStatus = pool.status();
        if (poolStatus != PoolStatus.ACTIVE && poolStatus != PoolStatus.PENDING) {
            revert PoolNotActive();
        }
        uint256 poolReshares = pool.reshares();
        if (poolReshares >= 2) {
            revert PoolMaxReshared();
        }
        bytes memory poolPublicKey = pool.publicKey();
        uint256 ssvAmount = retrieveFees(feeAmount, minTokenAmount, address(ssvToken), processed);
        ssvToken.approve(address(ssvClusters), ssvAmount);
        ssvClusters.removeValidator(poolPublicKey, pool.getOperatorIds(), oldCluster);
        ssvClusters.registerValidator(poolPublicKey, operatorIds, shares, ssvAmount, cluster);
        pool.setOperatorIds(operatorIds);
        pool.setReshares(poolReshares + 1);
        registry.removeOperatorPool(oldOperatorId, poolId, 0);
        registry.addOperatorPool(newOperatorId, poolId);
        emit PoolReshared(poolId);
    }

    /// @inheritdoc ICasimirManagerDev
    function reportForcedExits(uint32[] memory poolIds) external {
        onlyOracle();
        uint256 newForcedExits;
        uint256 newRequestedExits;
        for (uint256 i; i < poolIds.length; i++) {
            uint32 poolId = poolIds[i];
            ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
            PoolStatus poolStatus = pool.status();
            if (poolStatus == PoolStatus.EXITING_FORCED) {
                revert ForcedExitAlreadyReported();
            }
            newForcedExits++;
            if (poolStatus == PoolStatus.EXITING_REQUESTED) {
                newRequestedExits++;
            }
            pool.setStatus(PoolStatus.EXITING_FORCED);
        }
        forcedExits += newForcedExits;
        requestedExits -= newRequestedExits;
        emit ForcedExitsReported(poolIds);
    }

    /// @inheritdoc ICasimirManagerDev
    function reportCompletedExit(
        uint256 stakedPoolIndex,
        uint32[] memory blamePercents,
        ISSVNetworkCore.Cluster memory cluster
    ) external {
        onlyOracle();
        uint32 poolId = stakedPoolIds[stakedPoolIndex];
        ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
        PoolStatus poolStatus = pool.status();
        if (poolStatus != PoolStatus.EXITING_FORCED && poolStatus != PoolStatus.EXITING_REQUESTED) {
            revert PoolNotExiting();
        }
        stakedPoolIds.removeUint32Item(stakedPoolIndex);
        if (poolStatus == PoolStatus.EXITING_REQUESTED) {
            requestedExits--;
        } else if (poolStatus == PoolStatus.EXITING_FORCED) {
            forcedExits--;
        }
        pool.withdrawBalance(blamePercents);
        ssvClusters.removeValidator(pool.publicKey(), pool.getOperatorIds(), cluster);
        emit ExitCompleted(poolId);
    }

    /// @inheritdoc ICasimirManagerDev
    function resetFunctions() external {
        onlyFactoryOwner();
        functionsId = 0;
    }

    /// @inheritdoc ICasimirManagerDev
    function withdrawClusterBalance(
        uint64[] memory operatorIds,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 amount
    ) external {
        onlyOracle();
        ssvClusters.withdraw(operatorIds, amount, cluster);
    }

    /// @inheritdoc ICasimirManagerDev
    function cancelFunctions() external {
        onlyFactoryOwner();
        functionsBillingRegistry.cancelSubscription(functionsId, address(this));
        functionsId = 0;
        emit FunctionsCancelled();
    }

    /// @inheritdoc ICasimirManagerDev
    function cancelUpkeep() external {
        onlyFactoryOwner();
        keeperRegistry.cancelUpkeep(upkeepId);
        upkeepId = 0;
        emit UpkeepCancelled();
    }

    /// @inheritdoc ICasimirManagerDev
    function withdrawLINKBalance(uint256 amount) external {
        onlyFactoryOwner();
        if (!linkToken.transfer(msg.sender, amount)) {
            revert TransferFailed();
        }
        emit LINKBalanceWithdrawn(amount);
    }

    /// @inheritdoc ICasimirManagerDev
    function withdrawSSVBalance(uint256 amount) external {
        onlyFactoryOwner();
        SafeERC20Upgradeable.safeTransfer(ssvToken, msg.sender, amount);
        emit SSVBalanceWithdrawn(amount);
    }

    /// @inheritdoc ICasimirManagerDev
    function getPendingWithdrawalEligibility(
        uint256 index,
        uint256 period
    ) external view returns (bool pendingWithdrawalEligibility) {
        if (requestedWithdrawals > index) {
            pendingWithdrawalEligibility = requestedWithdrawalQueue[index].period <= period;
        }
    }

    /// @inheritdoc ICasimirManagerDev
    function getPendingPoolIds() external view returns (uint32[] memory) {
        return pendingPoolIds;
    }

    /// @inheritdoc ICasimirManagerDev
    function getStakedPoolIds() external view returns (uint32[] memory) {
        return stakedPoolIds;
    }

    /// @inheritdoc ICasimirManagerDev
    function getPoolAddress(uint32 poolId) external view returns (address poolAddress) {
        poolAddress = poolAddresses[poolId];
    }

    /// @inheritdoc ICasimirManagerDev
    function getRegistryAddress() external view returns (address registryAddress) {
        registryAddress = address(registry);
    }

    /// @inheritdoc ICasimirManagerDev
    function getUpkeepAddress() external view returns (address upkeepAddress) {
        upkeepAddress = address(upkeep);
    }

    /// @inheritdoc ICasimirManagerDev
    function getUserStake(address userAddress) public view returns (uint256 userStake) {
        userStake = MathUpgradeable.mulDiv(users[userAddress].stake0, stakeRatioSum, users[userAddress].stakeRatioSum0);
    }

    /// @inheritdoc ICasimirManagerDev
    function getTotalStake() public view returns (uint256 totalStake) {
        totalStake =
            getWithdrawableBalance() +
            (readyPoolIds.length + pendingPoolIds.length) *
            POOL_CAPACITY +
            latestBeaconBalanceAfterFees -
            requestedWithdrawalBalance;
    }

    /// @inheritdoc ICasimirManagerDev
    function getLatestActiveRewardBalance() external view returns (int256) {
        return latestActiveRewardBalance;
    }

    /// @inheritdoc ICasimirManagerDev
    function getStakeRatioSum() external view returns (uint256) {
        return stakeRatioSum;
    }

    /// @inheritdoc ICasimirManagerDev
    function getWithdrawableBalance() public view returns (uint256 withdrawableBalance) {
        withdrawableBalance = prepoolBalance + exitedBalance;
    }

    /// @notice Deposit the current tip balance
    function depositTips() private {
        uint256 tipsAfterFees = subtractFees(tipBalance);
        reservedFeeBalance += tipBalance - tipsAfterFees;
        tipBalance = 0;
        distributeStake(tipsAfterFees);
        emit TipsDeposited(tipsAfterFees);
    }

    /**
     * @dev Distribute stake to new pools
     * @param amount Stake amount to distribute
     */
    function distributeStake(uint256 amount) private {
        while (amount > 0) {
            uint256 remainingCapacity = POOL_CAPACITY - prepoolBalance;
            if (remainingCapacity > amount) {
                prepoolBalance += amount;
                amount = 0;
            } else {
                prepoolBalance = 0;
                amount -= remainingCapacity;
                readyPoolIds.push(++lastPoolId);
                emit InitiationRequested(lastPoolId);
            }
        }
    }

    /**
     * @notice Fulfill a user withdrawal
     * @param userAddress User address
     * @param amount Withdrawal amount
     */
    function fulfillWithdrawal(address userAddress, uint256 amount) private {
        (bool success, ) = userAddress.call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }
        emit WithdrawalFulfilled(userAddress, amount);
    }

    /**
     * @notice Request a given count of staked pool exits
     * @param count Count of exits to request
     */
    function requestExits(uint256 count) private {
        uint256 index = 0;
        while (count > 0) {
            uint32 poolId = stakedPoolIds[index];
            ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
            PoolStatus poolStatus = pool.status();
            if (poolStatus == PoolStatus.PENDING || poolStatus == PoolStatus.ACTIVE) {
                count--;
                index++;
                pool.setStatus(PoolStatus.EXITING_REQUESTED);
                requestedExits++;
                emit ExitRequested(poolId);
            }
        }
    }

    /**
     * @dev Retrieve fees for a given amount of a given token
     * @param amount Amount to retrieve
     * @param minTokenAmount Minimum token amount out after processing fees
     * @param token Token address
     * @param processed Whether the amount is already processed
     */
    function retrieveFees(
        uint256 amount,
        uint256 minTokenAmount,
        address token,
        bool processed
    ) private returns (uint256 amountOut) {
        if (processed) {
            amountOut = amount;
        } else {
            reservedFeeBalance -= amount;
            wethToken.deposit{value: amount}();
            wethToken.approve(address(swapRouter), wethToken.balanceOf(address(this)));
            IUniswapV3PoolState swapPool = IUniswapV3PoolState(
                swapFactory.getPool(address(wethToken), token, UNISWAP_FEE_TIER)
            );
            if (swapPool.liquidity() < amount) {
                revert InsufficientLiquidity();
            }
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
                tokenIn: address(wethToken),
                tokenOut: token,
                fee: UNISWAP_FEE_TIER,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amount,
                amountOutMinimum: minTokenAmount,
                sqrtPriceLimitX96: 0
            });
            amountOut = swapRouter.exactInputSingle(params);
        }
    }

    /**
     * @dev Subtract fees from a given amount
     * @param amount Original amount
     * @return amountAfterFees Amount after fees
     */
    function subtractFees(uint256 amount) private view returns (uint256 amountAfterFees) {
        amountAfterFees = MathUpgradeable.mulDiv(amount, 100, 100 + userFee);
    }

    /// @dev Validate the caller is the factory owner
    function onlyFactoryOwner() private view {
        if (msg.sender != factory.getOwner()) {
            revert Unauthorized();
        }
    }

    /// @dev Validate the caller is the oracle
    function onlyOracle() private view {
        if (msg.sender != daoOracleAddress) {
            revert Unauthorized();
        }
    }

    /// @dev Validate the caller is the pool
    function onlyPool(address poolAddress) private view {
        if (msg.sender != poolAddress) {
            revert Unauthorized();
        }
    }

    /// @dev Validate the contract is unpaused
    function onlyUnpaused() private view {
        if (paused) {
            revert Paused();
        }
    }

    /// @dev Validate the caller is the upkeep
    function onlyUpkeep() private view {
        if (msg.sender != address(upkeep)) {
            revert Unauthorized();
        }
    }
}
