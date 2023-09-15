// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./interfaces/ICasimirManager.sol";
import "./libraries/CasimirArray.sol";
import "./libraries/CasimirFactory.sol";
import "./vendor/interfaces/IDepositContract.sol";
import "./vendor/interfaces/ISSVNetwork.sol";
import "./vendor/interfaces/IWETH9.sol";
import "./vendor/interfaces/IFunctionsBillingRegistry.sol";
import "./vendor/interfaces/IKeeperRegistrar.sol";
import "./vendor/interfaces/IAutomationRegistry.sol";
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

/**
 * @title Manager contract that accepts and distributes deposits
 */
contract CasimirManager is
    ICasimirManager,
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable
{
    /*************/
    /* Libraries */
    /*************/

    /** Use internal type for uint32 array */
    using CasimirArray for uint32[];
    /** Use internal type for bytes array */
    using CasimirArray for bytes[];
    /** Use internal type for withdrawal array */
    using CasimirArray for Withdrawal[];

    /*************/
    /* Constants */
    /*************/

    /** Compound minimum (0.1 ETH) */
    uint256 private constant COMPOUND_MINIMUM = 100000000 gwei;
    /** Scale factor for each rewards to stake ratio */
    uint256 private constant SCALE_FACTOR = 1 ether;
    /** Uniswap 0.3% fee tier */
    uint24 private constant UNISWAP_FEE_TIER = 3000;
    /** Pool capacity */
    uint256 private constant POOL_CAPACITY = 32 ether;
    /** Total fee percentage */
    uint32 public constant FEE_PERCENT = 5;

    /*********/
    /* State */
    /*********/

    /** DAO oracle address */
    address private oracleAddress;
    /** Registry contract */
    ICasimirRegistry private registry;
    /** Upkeep contract */
    ICasimirUpkeep private upkeep;
    /** Beacon deposit contract */
    IDepositContract private beaconDeposit;
    /** Chainlink functions billing registry contract */
    IFunctionsBillingRegistry private functionsBillingRegistry;
    /** Keeper registrar contract */
    IKeeperRegistrar private keeperRegistrar;
    /** Automation registry contract */
    IAutomationRegistry private keeperRegistry;
    /** LINK ERC-20 token contract */
    LinkTokenInterface private linkToken;
    /** Pool beacon contract */
    IBeaconUpgradeable private poolBeacon;
    /** SSV clusters contract */
    ISSVClusters private ssvClusters;
    /** SSV ERC-20 token contract */
    IERC20Upgradeable private ssvToken;
    /** Uniswap factory contract */
    IUniswapV3Factory private swapFactory;
    /** Uniswap router contract  */
    ISwapRouter private swapRouter;
    /** Last pool ID created */
    uint32 private lastPoolId;
    /** Current report period */
    uint32 public reportPeriod;
    /** Chainlink functions subscription ID */
    uint64 public functionsId;
    /** Chainlink upkeep subscription ID */
    uint256 public upkeepId;
    /** Latest beacon chain balance */
    uint256 public latestBeaconBalance;
    /** Latest beacon chain balance after fees */
    uint256 private latestBeaconBalanceAfterFees;
    /** Latest active rewards */
    int256 private latestActiveRewardBalance;
    /** Exited pool count */
    uint256 public finalizableCompletedExits;
    /** Report finalizable exited balance */
    uint256 private finalizableExitedBalance;
    /** Report finalizable recovered balance */
    uint256 private finalizableRecoveredBalance;
    /** Token addresses */
    mapping(Token => address) private tokenAddresses;
    /** All users */
    mapping(address => User) private users;
    /** Sum of scaled rewards to balance ratios */
    uint256 private stakeRatioSum;
    /** Total pending withdrawals count */
    uint256 private requestedWithdrawals;
    /** Total pending withdrawal amount */
    uint256 public requestedWithdrawalBalance;
    /** Pending withdrawals */
    Withdrawal[] private requestedWithdrawalQueue;
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
    /** Total reserved fees */
    uint256 public reservedFeeBalance;
    /** IDs of pools ready for initiation */
    uint32[] private readyPoolIds;
    /** IDS of pools pending deposit confirmation */
    uint32[] private pendingPoolIds;
    /** IDs of pools staked */
    uint32[] private stakedPoolIds;
    /** Exiting pool count */
    uint256 public requestedExits;
    /** Slashed pool count */
    uint256 private forcedExits;
    /** Storage gap */
    uint256[50] private __gap;

    // @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param beaconDepositAddress The Beacon deposit address
     * @param daoOracleAddress The DAO oracle address
     * @param functionsBillingRegistryAddress The Chainlink functions billing registry address
     * @param functionsOracleAddress The Chainlink functions oracle address
     * @param keeperRegistrarAddress The Chainlink keeper registrar address
     * @param keeperRegistryAddress The Chainlink keeper registry address
     * @param linkTokenAddress The Chainlink token address
     * @param poolBeaconAddress The pool beacon address
     * @param registryBeaconAddress The registry beacon address
     * @param ssvNetworkAddress The SSV network address
     * @param ssvViewsAddress The SSV views address
     * @param ssvTokenAddress The SSV token address
     * @param swapFactoryAddress The Uniswap factory address
     * @param swapRouterAddress The Uniswap router address
     * @param upkeepBeaconAddress The upkeep beacon address
     * @param wethTokenAddress The WETH contract address
     */
    function initialize(
        address beaconDepositAddress,
        address daoOracleAddress,
        address functionsBillingRegistryAddress,
        address functionsOracleAddress,
        address keeperRegistrarAddress,
        address keeperRegistryAddress,
        address linkTokenAddress,
        address poolBeaconAddress,
        address registryBeaconAddress,
        address ssvNetworkAddress,
        address ssvViewsAddress,
        address ssvTokenAddress,
        address swapFactoryAddress,
        address swapRouterAddress,
        address upkeepBeaconAddress,
        address wethTokenAddress
    ) public initializer {
        onlyAddress(beaconDepositAddress);
        onlyAddress(daoOracleAddress);
        onlyAddress(functionsBillingRegistryAddress);
        onlyAddress(functionsOracleAddress);
        onlyAddress(keeperRegistrarAddress);
        onlyAddress(keeperRegistryAddress);
        onlyAddress(linkTokenAddress);
        onlyAddress(poolBeaconAddress);
        onlyAddress(registryBeaconAddress);
        onlyAddress(ssvNetworkAddress);
        onlyAddress(ssvViewsAddress);
        onlyAddress(ssvTokenAddress);
        onlyAddress(swapFactoryAddress);
        onlyAddress(swapRouterAddress);
        onlyAddress(upkeepBeaconAddress);
        onlyAddress(wethTokenAddress);

        __Ownable_init();
        __ReentrancyGuard_init();
        oracleAddress = daoOracleAddress;
        beaconDeposit = IDepositContract(beaconDepositAddress);
        functionsBillingRegistry = IFunctionsBillingRegistry(
            functionsBillingRegistryAddress
        );
        keeperRegistrar = IKeeperRegistrar(keeperRegistrarAddress);
        keeperRegistry = IAutomationRegistry(keeperRegistryAddress);
        linkToken = LinkTokenInterface(linkTokenAddress);
        tokenAddresses[Token.LINK] = linkTokenAddress;
        poolBeacon = IBeaconUpgradeable(poolBeaconAddress);
        ssvClusters = ISSVClusters(ssvNetworkAddress);
        tokenAddresses[Token.SSV] = ssvTokenAddress;
        ssvToken = IERC20Upgradeable(ssvTokenAddress);
        swapFactory = IUniswapV3Factory(swapFactoryAddress);
        swapRouter = ISwapRouter(swapRouterAddress);
        tokenAddresses[Token.WETH] = wethTokenAddress;
        registry = ICasimirRegistry(
            CasimirFactory.createRegistry(
                registryBeaconAddress,
                ssvViewsAddress
            )
        );
        upkeep = ICasimirUpkeep(
            CasimirFactory.createUpkeep(
                upkeepBeaconAddress,
                functionsOracleAddress
            )
        );
        stakeRatioSum = 1000 ether;
    }

    /**
     * @notice Receive and deposit validator tips
     */
    receive() external payable {
        tipBalance += msg.value;
        if (tipBalance >= COMPOUND_MINIMUM) {
            depositTips();
        }
    }

    /**
     * @notice Deposit user stake
     */
    function depositStake() external payable nonReentrant {
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
     * @notice Deposit a given amount of rewards from a pool
     * @param poolId The pool ID
     */
    function depositRewards(uint32 poolId) external payable {
        if (msg.value == 0) {
            revert InvalidAmount();
        }
        address poolAddress = poolAddresses[poolId];
        if (msg.sender != poolAddress) {
            revert Unauthorized();
        }

        uint256 rewardsAfterFees = subtractFees(msg.value);
        reservedFeeBalance += msg.value - rewardsAfterFees;
        distributeStake(rewardsAfterFees);

        emit RewardsDeposited(rewardsAfterFees);
    }

    /**
     * @notice Deposit exited balance from a given pool ID
     * @param poolId The pool ID
     */
    function depositExitedBalance(uint32 poolId) external payable {
        if (msg.sender != poolAddresses[poolId]) {
            revert Unauthorized();
        }
        uint256 balance = msg.value + recoveredBalances[poolId];
        delete recoveredBalances[poolId];
        delete poolAddresses[poolId];
        exitedBalance += balance;
        finalizableExitedBalance += balance;
        finalizableCompletedExits++;

        emit ExitedBalanceDeposited(poolId, msg.value);
    }

    /**
     * @notice Deposit recovered balance for a given pool from an operator
     * @param poolId The pool ID
     */
    function depositRecoveredBalance(
        uint32 poolId
    ) external payable {
        if (msg.sender != address(registry)) {
            revert Unauthorized();
        }

        recoveredBalances[poolId] += msg.value;
        finalizableRecoveredBalance += msg.value;

        emit RecoveredBalanceDeposited(poolId, msg.value);
    }

    /**
     * @notice Deposit to a cluster balance
     * @param operatorIds The operator IDs
     * @param cluster The SSV cluster snapshot
     * @param feeAmount The fee amount to deposit
     * @param minimumTokenAmount The minimum SSV token amount out after processing fees
     * @param processed Whether the fee amount is already processed
     */
    function depositClusterBalance(
        uint64[] memory operatorIds,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 feeAmount,
        uint256 minimumTokenAmount,
        bool processed
    ) external {
        onlyOracle();
        uint256 ssvAmount = retrieveFees(
            feeAmount,
            minimumTokenAmount,
            tokenAddresses[Token.SSV],
            processed
        );
        ssvToken.approve(address(ssvClusters), ssvAmount);
        ssvClusters.deposit(address(this), operatorIds, ssvAmount, cluster);

        emit ClusterBalanceDeposited(ssvAmount);
    }

    /**
     * @notice Deposit to the functions balance
     * @param feeAmount The fee amount to deposit
     * @param minimumTokenAmount The minimum LINK token amount out after processing fees
     * @param processed Whether the fee amount is already processed
     */
    function depositFunctionsBalance(
        uint256 feeAmount,
        uint256 minimumTokenAmount,
        bool processed
    ) external {
        onlyOracle();
        uint256 linkAmount = retrieveFees(
            feeAmount,
            minimumTokenAmount,
            tokenAddresses[Token.LINK],
            processed
        );
        if (functionsId == 0) {
            functionsId = functionsBillingRegistry.createSubscription();
            functionsBillingRegistry.addConsumer(functionsId, address(upkeep));
        }
        if (
            !linkToken.transferAndCall(
                address(functionsBillingRegistry),
                linkAmount,
                abi.encode(functionsId)
            )
        ) {
            revert TransferFailed();
        }

        emit FunctionsBalanceDeposited(linkAmount);
    }

    /**
     * @notice Deposit to the upkeep balance
     * @param feeAmount The fee amount to deposit
     * @param minimumTokenAmount The minimum LINK token amount out after processing fees
     * @param processed Whether the fee amount is already processed
     */
    function depositUpkeepBalance(
        uint256 feeAmount,
        uint256 minimumTokenAmount,
        bool processed
    ) external {
        onlyOracle();
        uint256 linkAmount = retrieveFees(
            feeAmount,
            minimumTokenAmount,
            tokenAddresses[Token.LINK],
            processed
        );
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

    /**
     * @notice Deposit reserved fees
     */
    function depositReservedFees() external payable onlyOwner {
        reservedFeeBalance += msg.value;

        emit ReservedFeesDeposited(msg.value);
    }

    /**
     * @notice Withdraw a given amount of reserved fees
     * @param amount The amount of fees to withdraw
     */
    function withdrawReservedFees(uint256 amount) external onlyOwner {
        if (amount > reservedFeeBalance) {
            revert InvalidAmount();
        }

        reservedFeeBalance -= amount;
        (bool success, ) = owner().call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }

        emit ReservedFeesWithdrawn(amount);
    }

    /**
     * @notice Rebalance the rewards to stake ratio and redistribute swept rewards
     * @param beaconBalance The beacon chain balance
     * @param sweptBalance The swept balance
     * @param activatedDeposits The count of activated deposits
     * @param completedExits The count of withdrawn exits
     */
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
        int256 rewards = int256(
            beaconBalance + sweptBalance + finalizableRecoveredBalance
        ) - int256(expectedEffectiveBalance + expectedExitedBalance);
        int256 change = rewards - latestActiveRewardBalance;
        if (change > 0) {
            uint256 gain = uint256(change);
            if (rewards > 0) {
                uint256 gainAfterFees = subtractFees(gain);
                stakeRatioSum += MathUpgradeable.mulDiv(
                    stakeRatioSum,
                    gainAfterFees,
                    getTotalStake()
                );
                latestBeaconBalanceAfterFees += gainAfterFees;

                emit StakeRebalanced(gainAfterFees);
            } else {
                stakeRatioSum += MathUpgradeable.mulDiv(
                    stakeRatioSum,
                    gain,
                    getTotalStake()
                );
                latestBeaconBalanceAfterFees += gain;

                emit StakeRebalanced(gain);
            }
        } else if (change < 0) {
            uint256 loss = uint256(-change);
            stakeRatioSum -= MathUpgradeable.mulDiv(
                stakeRatioSum,
                loss,
                getTotalStake()
            );
            latestBeaconBalanceAfterFees -= loss;

            emit StakeRebalanced(loss);
        }
        int256 sweptRewards = int256(
            sweptBalance + finalizableRecoveredBalance
        ) - int256(finalizableExitedBalance);
        if (sweptRewards > 0) {
            latestBeaconBalanceAfterFees -= subtractFees(uint256(sweptRewards));
        }
        latestBeaconBalanceAfterFees -= finalizableExitedBalance;
        latestBeaconBalanceAfterFees += expectedActivatedBalance;
        latestActiveRewardBalance = rewards - sweptRewards;
        latestBeaconBalance = beaconBalance;
        finalizableExitedBalance = 0;
        finalizableRecoveredBalance = 0;
        finalizableCompletedExits = 0;
    }

    /**
     * @notice Compound rewards given a list of pool IDs
     * @param poolIds The list of pool IDs
     */
    function compoundRewards(uint32[5] memory poolIds) external {
        onlyUpkeep();
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
    function requestWithdrawal(uint256 amount) external nonReentrant {
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
            requestedWithdrawalQueue.push(
                Withdrawal({
                    user: msg.sender,
                    amount: amount,
                    period: reportPeriod
                })
            );
            requestedWithdrawalBalance += amount;
            requestedWithdrawals++;
            uint256 coveredExitBalance = requestedExits * POOL_CAPACITY;
            if (requestedWithdrawalBalance > coveredExitBalance) {
                uint256 exitsRequired = (requestedWithdrawalBalance -
                    coveredExitBalance) / POOL_CAPACITY;
                if (
                    (requestedWithdrawalBalance - coveredExitBalance) %
                        POOL_CAPACITY >
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
            fulfillWithdrawal(withdrawal.user, withdrawal.amount);
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

    /**
     * @notice Initiate the next ready pool
     * @param depositDataRoot The deposit data root
     * @param publicKey The validator public key
     * @param signature The signature
     * @param withdrawalCredentials The withdrawal credentials
     * @param operatorIds The operator IDs
     * @param shares The operator shares
     * @param feeAmount The fee amount to deposit
     * @param minimumTokenAmount The minimum SSV token amount out after processing fees
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
        uint256 minimumTokenAmount,
        bool processed
    ) external {
        onlyOracle();
        if (readyPoolIds.length == 0) {
            revert NoReadyPools();
        }

        uint32 poolId = readyPoolIds[0];
        readyPoolIds.removeUint32Item(0);
        pendingPoolIds.push(poolId);
        poolAddresses[poolId] = CasimirFactory.createPool(
            address(poolBeacon),
            address(registry),
            poolId,
            publicKey,
            operatorIds
        );
        bytes memory computedWithdrawalCredentials = abi.encodePacked(
            bytes1(uint8(1)),
            bytes11(0),
            poolAddresses[poolId]
        );
        if (
            keccak256(computedWithdrawalCredentials) !=
            keccak256(withdrawalCredentials)
        ) {
            revert InvalidWithdrawalCredentials();
        }

        {
            for (uint256 i = 0; i < operatorIds.length; i++) {
                registry.addOperatorPool(operatorIds[i], poolId);
            }
            beaconDeposit.deposit{value: POOL_CAPACITY}(
                publicKey,
                withdrawalCredentials,
                signature,
                depositDataRoot
            );
            uint256 ssvAmount = retrieveFees(
                feeAmount,
                minimumTokenAmount,
                tokenAddresses[Token.SSV],
                processed
            );
            ssvToken.approve(address(ssvClusters), ssvAmount);
            ssvClusters.registerValidator(
                publicKey,
                operatorIds,
                shares,
                ssvAmount,
                cluster
            );

            emit PoolRegistered(poolId);
        }

        emit DepositInitiated(poolId);
    }

    /**
     * @notice Activate a given count of the next pending pools
     * @param count The number of pools to activate
     */
    function activateDeposits(uint256 count) external {
        onlyUpkeep();
        if (pendingPoolIds.length == 0) {
            revert NoPendingPools();
        }

        while (count > 0) {
            count--;
            uint32 poolId = pendingPoolIds[0];
            ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
            ICasimirPool.PoolDetails memory poolDetails = pool.getDetails();
            if (poolDetails.status != ICasimirPool.PoolStatus.PENDING) {
                revert PoolNotPending();
            }

            pool.setStatus(ICasimirPool.PoolStatus.ACTIVE);
            pendingPoolIds.removeUint32Item(0);
            stakedPoolIds.push(poolId);

            emit DepositActivated(poolId);
        }
    }

    /**
     * @notice Request reports a given count of forced exits
     * @param count The number of forced exits
     */
    function requestForcedExitReports(uint256 count) external {
        onlyUpkeep();
        emit ForcedExitReportsRequested(count);
    }

    /**
     * @notice Request reports for a given count of completed exits
     * @param count The number of completed exits
     */
    function requestCompletedExitReports(uint256 count) external {
        onlyUpkeep();
        emit CompletedExitReportsRequested(count);
    }

    /**
     * @notice Request reshares for an operator
     * @param operatorId The operator ID
     */
    function requestReshares(uint64 operatorId) external {
        if (msg.sender != oracleAddress && msg.sender != address(registry)) {
            revert Unauthorized();
        }

        emit ResharesRequested(operatorId);
    }

    /**
     * @notice Report pool forced (unrequested) exits
     * @param poolIds The pool IDs
     */
    function reportForcedExits(uint32[] memory poolIds) external {
        onlyOracle();
        uint256 newForcedExits;
        uint256 newRequestedExits;
        for (uint256 i = 0; i < poolIds.length; i++) {
            uint32 poolId = poolIds[i];
            ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
            ICasimirPool.PoolDetails memory poolDetails = pool.getDetails();
            if (poolDetails.status == ICasimirPool.PoolStatus.EXITING_FORCED) {
                revert ForcedExitAlreadyReported();
            }

            newForcedExits++;
            if (
                poolDetails.status == ICasimirPool.PoolStatus.EXITING_REQUESTED
            ) {
                newRequestedExits++;
            }
            pool.setStatus(ICasimirPool.PoolStatus.EXITING_FORCED);
        }
        forcedExits += newForcedExits;
        requestedExits -= newRequestedExits;

        emit ForcedExitsReported(poolIds);
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
    ) external {
        onlyOracle();
        uint32 poolId = stakedPoolIds[poolIndex];
        ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
        ICasimirPool.PoolDetails memory poolDetails = pool.getDetails();
        if (
            poolDetails.status != ICasimirPool.PoolStatus.EXITING_FORCED &&
            poolDetails.status != ICasimirPool.PoolStatus.EXITING_REQUESTED
        ) {
            revert PoolNotExiting();
        }

        stakedPoolIds.removeUint32Item(poolIndex);
        if (poolDetails.status == ICasimirPool.PoolStatus.EXITING_REQUESTED) {
            requestedExits--;
        } else if (
            poolDetails.status == ICasimirPool.PoolStatus.EXITING_FORCED
        ) {
            forcedExits--;
        }
        pool.setStatus(ICasimirPool.PoolStatus.WITHDRAWN);
        pool.withdrawBalance(blamePercents);
        ssvClusters.removeValidator(
            poolDetails.publicKey,
            poolDetails.operatorIds,
            cluster
        );

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
     * @param minimumTokenAmount The minimum SSV token amount out after processing fees
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
        uint256 minimumTokenAmount,
        bool processed
    ) external {
        onlyOracle();
        ICasimirPool pool = ICasimirPool(poolAddresses[poolId]);
        ICasimirPool.PoolDetails memory poolDetails = pool.getDetails();
        if (
            poolDetails.status != ICasimirPool.PoolStatus.ACTIVE &&
            poolDetails.status != ICasimirPool.PoolStatus.PENDING
        ) {
            revert PoolNotActive();
        }
        if (poolDetails.reshares >= 2) {
            revert PoolAlreadyReshared();
        }

        pool.setReshares(poolDetails.reshares + 1);

        registry.removeOperatorPool(oldOperatorId, poolId, 0);
        registry.addOperatorPool(newOperatorId, poolId);

        uint256 ssvAmount = retrieveFees(
            feeAmount,
            minimumTokenAmount,
            tokenAddresses[Token.SSV],
            processed
        );
        ssvToken.approve(address(ssvClusters), ssvAmount);

        ssvClusters.removeValidator(
            poolDetails.publicKey,
            oldOperatorIds,
            oldCluster
        );

        ssvClusters.registerValidator(
            poolDetails.publicKey,
            operatorIds,
            shares,
            ssvAmount,
            cluster
        );

        emit ReshareCompleted(poolId);
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
    ) external {
        onlyOracle();
        ssvClusters.withdraw(operatorIds, amount, cluster);
    }

    /**
     * @notice Cancel the Chainlink functions subscription
     */
    function cancelFunctions() external {
        onlyOracle();
        functionsBillingRegistry.cancelSubscription(functionsId, address(this));
        functionsId = 0;

        emit FunctionsCancelled();
    }

    /**
     * @notice Cancel the Chainlink upkeep subscription
     */
    function cancelUpkeep() external {
        onlyOracle();
        keeperRegistry.cancelUpkeep(upkeepId);
        upkeepId = 0;

        emit UpkeepCancelled();
    }

    /**
     * @notice Withdraw a given amount from the LINK balance
     * @param amount The amount to withdraw
     */
    function withdrawLINKBalance(uint256 amount) external onlyOwner {
        if (!linkToken.transfer(owner(), amount)) {
            revert TransferFailed();
        }

        emit LINKBalanceWithdrawn(amount);
    }

    /**
     * @notice Withdraw a given amount from the SSV balance
     * @param amount The amount to withdraw
     */
    function withdrawSSVBalance(uint256 amount) external onlyOwner {
        SafeERC20Upgradeable.safeTransfer(ssvToken, owner(), amount);

        emit SSVBalanceWithdrawn(amount);
    }

    /**
     * Set a new Chainlink functions request
     * @param newRequestSource JavaScript source code
     * @param newRequestArgs List of arguments accessible from within the source code
     * @param newFulfillGasLimit The new Chainlink functions fulfill gas limit
     */
    function setFunctionsRequest(
        string calldata newRequestSource,
        string[] calldata newRequestArgs,
        uint32 newFulfillGasLimit
    ) external onlyOwner {
        upkeep.setFunctionsRequest(
            newRequestSource,
            newRequestArgs,
            newFulfillGasLimit
        );

        emit FunctionsRequestSet(
            newRequestSource,
            newRequestArgs,
            newFulfillGasLimit
        );
    }

    /**
     * @notice Set a new Chainlink functions oracle address
     * @param newFunctionsOracleAddress New Chainlink functions oracle address
     */
    function setFunctionsOracleAddress(
        address newFunctionsOracleAddress
    ) external onlyOwner {
        upkeep.setFunctionsOracleAddress(newFunctionsOracleAddress);

        emit FunctionsOracleAddressSet(newFunctionsOracleAddress);
    }

    /**
     * @notice Get the eligibility of a pending withdrawal
     * @param index The index of the pending withdrawal
     * @param period The period to check
     * @return pendingWithdrawalEligibility The eligibility of a pending withdrawal
     */
    function getPendingWithdrawalEligibility(
        uint256 index,
        uint256 period
    ) external view returns (bool pendingWithdrawalEligibility) {
        if (requestedWithdrawals > index) {
            pendingWithdrawalEligibility =
                requestedWithdrawalQueue[index].period <= period;
        }
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
     * @notice Get a pool's address by ID
     * @param poolId The pool ID
     * @return poolAddress The pool address
     */
    function getPoolAddress(uint32 poolId) external view returns (address) {
        return poolAddresses[poolId];
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
     * @notice Get the upkeep address
     * @return upkeepAddress The upkeep address
     */
    function getUpkeepAddress() external view returns (address upkeepAddress) {
        upkeepAddress = address(upkeep);
    }

    /**
     * @notice Get the total user stake for a given user address
     * @param userAddress The user address
     * @return userStake The total user stake
     */
    function getUserStake(
        address userAddress
    ) public view returns (uint256 userStake) {
        userStake = MathUpgradeable.mulDiv(
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
            latestBeaconBalanceAfterFees -
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
        bufferedBalance = getWithdrawableBalance() + readyPoolIds.length * POOL_CAPACITY;
    }

    /**
     * @notice Get the withdrawable balanace
     * @return withdrawableBalance The withdrawable balanace
     */
    function getWithdrawableBalance() public view returns (uint256) {
        return prepoolBalance + exitedBalance;
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
     * @dev Distribute a given amount of stake
     * @param amount The amount of stake to distribute
     */
    function distributeStake(uint256 amount) private {
        while (amount > 0) {
            uint256 remainingCapacity = POOL_CAPACITY - prepoolBalance;
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
     * @notice Fulfill a withdrawal
     * @param sender The withdrawal sender
     * @param amount The withdrawal amount
     */
    function fulfillWithdrawal(address sender, uint256 amount) private {
        (bool success, ) = sender.call{value: amount}("");
        if (!success) {
            revert TransferFailed();
        }

        emit WithdrawalFulfilled(sender, amount);
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
            ICasimirPool.PoolDetails memory poolDetails = pool.getDetails();
            if (
                poolDetails.status == ICasimirPool.PoolStatus.PENDING ||
                poolDetails.status == ICasimirPool.PoolStatus.ACTIVE
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
     * @dev Retrieve fees for a given amount of a given token
     * @param amount The amount to retrieve
     * @param minimumTokenAmount The minimum token amount out after processing fees
     * @param token The token address
     * @param processed Whether the amount is already processed
     */
    function retrieveFees(
        uint256 amount,
        uint256 minimumTokenAmount,
        address token,
        bool processed
    ) private returns (uint256 amountOut) {
        if (!processed) {
            amountOut = processFees(amount, minimumTokenAmount, token);
        } else {
            amountOut = amount;
        }
    }

    /**
     * @dev Process reserved fees to a given token
     * @param amount The amount to process
     * @param minimumTokenAmount The minimum token amount out after processing fees
     * @param tokenOut The output token address
     * @return amountOut The output token amount out
     */
    function processFees(
        uint256 amount,
        uint256 minimumTokenAmount,
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
                UNISWAP_FEE_TIER
            )
        );
        require(swapPool.liquidity() >= amount, "Not enough liquidity");

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenAddresses[Token.WETH],
                tokenOut: tokenOut,
                fee: UNISWAP_FEE_TIER,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amount,
                amountOutMinimum: minimumTokenAmount,
                sqrtPriceLimitX96: 0
            });
        amountOut = swapRouter.exactInputSingle(params);
    }

    /**
     * @dev Get reservable fees from a given amount
     * @param amount The amount to reserve fees from
     * @return amountAfterFees The amount after fees
     */
    function subtractFees(
        uint256 amount
    ) private pure returns (uint256 amountAfterFees) {
        amountAfterFees = MathUpgradeable.mulDiv(
            amount,
            100,
            100 + FEE_PERCENT
        );
    }

    /**
     * @dev Validate the caller is the oracle
     */
    function onlyOracle() private view {
        if (msg.sender != oracleAddress) {
            revert Unauthorized();
        }
    }

    /**
     * @dev Validate the caller is the upkeep contract
     */
    function onlyUpkeep() private view {
        if (msg.sender != address(upkeep)) {
            revert Unauthorized();
        }
    }

    /**
     * @dev Validate an address is not the zero address
     */
    function onlyAddress(address checkAddress) private pure {
        if (checkAddress == address(0)) {
            revert InvalidAddress();
        }
    }
}
