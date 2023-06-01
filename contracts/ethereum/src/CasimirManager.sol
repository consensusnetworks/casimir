// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

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

    /** Manager oracle address */
    address private immutable oracleAddress;
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

    /** Latest active rewards */
    int256 private latestRewards;
    /** Latest active balance */
    uint256 private latestActiveBalance;
    /** Latest active balance after fees */
    uint256 private latestActiveBalanceAfterFees;
    /** Latest expected effective balance */
    uint256 private latestExpectedEffectiveBalance;
    /** Requested pool exit reports */
    uint256 private requestedPoolWithdrawnExitReports;
    /** Requested pool slash reports */
    uint256 private requestedPoolSlashedExitReports;
    /** Requested pool unexpected exit reports */
    uint256 private requestedPoolUnexpectedExitReports;
    /** Exited balance */
    uint256 private reportFinalizableWithdrawnBalance;
    /** Exited pool count */
    uint256 finalizableWithdrawnPoolCount;
    /** Current report period */
    uint32 private reportPeriod;
    /** Last pool ID created */
    uint32 private lastPoolId;
    /** Token addresses */
    mapping(Token => address) private tokenAddresses;
    /** Unswapped tokens by address */
    mapping(address => uint256) private unswappedTokens;
    /** All users */
    mapping(address => User) private users;
    /** Sum of scaled rewards to balance ratios (intial value required) */
    uint256 private stakeRatioSum = 1000 ether;
    /** Pending withdrawals */
    Withdrawal[] private pendingWithdrawalQueue;
    /** Total pending withdrawals */
    uint256 private pendingWithdrawals;
    /** Total pending withdrawals count */
    uint256 private pendingWithdrawalCount;
    /** All pools (ready, pending, or staked) */
    mapping(uint32 => Pool) private pools;
    /** Total deposits not yet in pools */
    uint256 private prepoolBalance;
    /** Total withdrawable deposits */
    uint256 private exitedBalance;
    /** Total reserved (execution) fees */
    uint256 private reservedFees;
    /** IDs of pools ready for initiation */
    uint32[] private readyPoolIds;
    /** IDS of pools pending deposit confirmation */
    uint32[] private pendingPoolIds;
    /** IDs of pools staked */
    uint32[] private stakedPoolIds;
    /** Active pool count */
    uint256 private depositedPoolCount;
    /** Slashed pool count */
    uint256 private slashedPoolCount;
    /** Exiting pool count */
    uint256 private exitingPoolCount;
    /** Total fee percentage */
    uint32 private feePercent = 5;
    /** ETH fee percentage */
    uint32 private ethFeePercent = 3;
    /** LINK fee percentage */
    uint32 private linkFeePercent = 1;
    /** SSV fee percentage */
    uint32 private ssvFeePercent = 1;

    /*************/
    /* Modifiers */
    /*************/

    /**
     * @dev Validate the caller is the manager oracle
     */
    modifier onlyOracle() {
        require(
            msg.sender == oracleAddress,
            "Only manager oracle can call this function"
        );
        _;
    }

    /**
     * @dev Validate the caller is the upkeep contract
     */
    modifier onlyUpkeep() {
        require(
            msg.sender == address(upkeep),
            "Only upkeep can call this function"
        );
        _;
    }

    /**
     * @dev Validate a deposit
     */
    modifier validateDeposit() {
        require(
            msg.value > 0,
            "Deposit must be greater than zero"
        );
        _;
    }

    /**
     * @dev Validate a distribution
     * @param amount The amount to validate
     */
    modifier validDistribution(uint256 amount) {
        require(
            amount > 0,
            "Distribution must be greater than zero"
        );
        _;
    }

    /**
     * @notice Constructor
     * @param _oracleAddress The manager oracle address
     * @param beaconDepositAddress The Beacon deposit address
     * @param functionsAddress The Chainlink functions oracle address
     * @param functionsSubscriptionId The Chainlink functions subscription ID
     * @param linkTokenAddress The Chainlink token address
     * @param ssvNetworkAddress The SSV network address
     * @param ssvTokenAddress The SSV token address
     * @param swapFactoryAddress The Uniswap factory address
     * @param swapRouterAddress The Uniswap router address
     * @param wethTokenAddress The WETH contract address
     */
    constructor(
        address _oracleAddress,
        address beaconDepositAddress,
        address functionsAddress,
        uint32 functionsSubscriptionId,
        address linkTokenAddress,
        address ssvNetworkAddress,
        address ssvTokenAddress,
        address swapFactoryAddress,
        address swapRouterAddress,
        address wethTokenAddress
    ) {
        oracleAddress = _oracleAddress;
        beaconDeposit = IDepositContract(beaconDepositAddress);
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
            functionsAddress,
            functionsSubscriptionId
        );
    }

    /**
     * @notice Redirect users to the deposit function
     */
    receive() external payable {
        revert("Use depositStake() instead");
    }

    /**
     * @notice Deposit user stake
     */
    function depositStake() external payable nonReentrant validateDeposit() {
        uint256 depositAfterFees = subtractFees(msg.value);
        reservedFees += msg.value - depositAfterFees;

        if (users[msg.sender].stake0 > 0) {
            users[msg.sender].stake0 = getUserStake(msg.sender);
        }
        users[msg.sender].stakeRatioSum0 = stakeRatioSum;
        users[msg.sender].stake0 += depositAfterFees;

        distributeStake(depositAfterFees);

        emit StakeDeposited(msg.sender, depositAfterFees);
    }

    /**
     * @notice Deposit a given amount of rewards
     * @param rewards The amount of rewards to deposit
     */
    function depositRewards(uint256 rewards) private {
        uint256 rewardsAfterFees = subtractFees(rewards);
        reservedFees += rewards - rewardsAfterFees;
        distributeStake(rewardsAfterFees);

        emit RewardsDeposited(rewardsAfterFees);
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
                Pool storage pool;
                pool = pools[poolId];
                prepoolBalance = 0;
                amount -= remainingCapacity;
                pool.deposits = poolCapacity;
                readyPoolIds.push(poolId);

                emit PoolDepositRequested(poolId);
            }
        }
    }

    /**
     * @notice Rebalance the rewards to stake ratio and redistribute swept rewards
     * @param activeBalance The active balance
     * @param sweptBalance The swept balance
     * @param activatedDeposits The count of activated deposits
     * @param withdrawnExits The count of withdrawn exits
     */
    function rebalanceStake(
        uint256 activeBalance,
        uint256 sweptBalance,
        uint256 activatedDeposits,
        uint256 withdrawnExits
    ) external onlyUpkeep() {
        uint256 activatedBalance = activatedDeposits * poolCapacity;
        uint256 withdrawnBalance = withdrawnExits * poolCapacity;
        int256 surplus = int256(activeBalance + sweptBalance) - (int256(getExpectedEffectiveBalance() + withdrawnBalance));
        int256 rewards = surplus - int256(reportFinalizableWithdrawnBalance);
        int256 change = rewards - latestRewards;

        if (change > 0) {
            uint256 gain = SafeCast.toUint256(change);
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
            uint256 loss = SafeCast.toUint256(-change);
            stakeRatioSum -= Math.mulDiv(stakeRatioSum, loss, getTotalStake());
            latestActiveBalanceAfterFees -= loss;

            emit StakeRebalanced(loss);
        }

        uint256 sweptRewards = sweptBalance - reportFinalizableWithdrawnBalance;
        latestRewards = rewards - int256(sweptRewards);
        if (sweptRewards > 0) {
            latestActiveBalanceAfterFees -= subtractFees(sweptRewards);
            depositRewards(sweptRewards);
        }

        latestActiveBalance = activeBalance;
        latestActiveBalanceAfterFees += activatedBalance;
        latestActiveBalanceAfterFees -= reportFinalizableWithdrawnBalance;

        reportPeriod++;
        reportFinalizableWithdrawnBalance = 0;
        finalizableWithdrawnPoolCount = 0;
    }

    /**
     * @notice Request to withdraw user stake
     * @param amount The amount of stake to withdraw
     */
    function requestWithdrawal(uint256 amount) external nonReentrant {
        users[msg.sender].stake0 = getUserStake(msg.sender);
        require(
            users[msg.sender].stake0 >= amount,
            "Withdrawing more than user stake"
        );

        users[msg.sender].stakeRatioSum0 = stakeRatioSum;
        users[msg.sender].stake0 -= amount;

        if (amount <= getWithdrawableBalance()) {
            completeWithdrawal(msg.sender, amount);
        } else {
            pendingWithdrawalQueue.push(
                Withdrawal({
                    user: msg.sender,
                    amount: amount,
                    period: reportPeriod
                })
            );
            pendingWithdrawals += amount;
            pendingWithdrawalCount++;

            uint256 coveredExitBalance = (exitingPoolCount - slashedPoolCount) *
                poolCapacity;
            if (pendingWithdrawals > coveredExitBalance) {
                uint256 exitsRequired = (pendingWithdrawals -
                    coveredExitBalance) / poolCapacity;
                if (exitsRequired == 0) {
                    exitsRequired = 1;
                }
                requestPoolExits(exitsRequired);
            }

            emit WithdrawalInitiated(msg.sender, amount);
        }
    }

    /**
     * @notice Complete a given count of pending withdrawals
     * @param count The number of withdrawals to complete
     */
    function completePendingWithdrawals(uint256 count) external onlyUpkeep() {
        while (count > 0) {
            count--;

            if (pendingWithdrawalQueue.length == 0) {
                break;
            }

            Withdrawal memory withdrawal = pendingWithdrawalQueue[0];

            if (withdrawal.period > reportPeriod) {
                break;
            }

            pendingWithdrawalQueue.remove(0);
            pendingWithdrawals -= withdrawal.amount;
            pendingWithdrawalCount--;

            completeWithdrawal(withdrawal.user, withdrawal.amount);

            emit WithdrawalCompleted(withdrawal.user, withdrawal.amount);
        }
    }

    /**
     * @notice Complete a withdrawal
     * @param sender The withdrawal sender
     * @param amount The withdrawal amount
     */
    function completeWithdrawal(address sender, uint256 amount) private {
        if (amount <= exitedBalance) {
            exitedBalance -= amount;
        } else {
            uint256 remainder = amount - exitedBalance;
            exitedBalance = 0;
            prepoolBalance -= remainder;
        }

        sender.send(amount);

        emit WithdrawalCompleted(sender, amount);
    }

    /**
     * @notice Initiate the next ready pool
     * @param depositDataRoot The deposit data root
     * @param publicKey The validator public key
     * @param signature The signature
     * @param withdrawalCredentials The withdrawal credentials
     * @param operatorIds The operator IDs
     * @param shares The operator shares
     * @param feeAmount The fee amount
     */
    function initiatePoolDeposit(
        bytes32 depositDataRoot,
        bytes calldata publicKey,
        bytes calldata signature,
        bytes calldata withdrawalCredentials,
        uint64[] memory operatorIds,
        bytes calldata shares,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 feeAmount
    ) external onlyOracle() {
        require(readyPoolIds.length > 0, "No ready pools");
        require(reservedFees >= feeAmount, "Not enough reserved fees");

        // Todo validate deposit data root

        reservedFees -= feeAmount;

        (, uint256 ssvFees) = processFees(feeAmount);

        uint32 poolId = readyPoolIds[0];
        Pool storage pool = pools[poolId];
        pool.depositDataRoot = depositDataRoot;
        pool.publicKey = publicKey;
        pool.operatorIds = operatorIds;
        pool.shares = shares;
        pool.signature = signature;
        pool.withdrawalCredentials = withdrawalCredentials;

        readyPoolIds.remove(0);
        pendingPoolIds.push(poolId);
        depositedPoolCount++;

        beaconDeposit.deposit{value: pool.deposits}(
            pool.publicKey,
            pool.withdrawalCredentials,
            pool.signature,
            pool.depositDataRoot
        );

        linkToken.approve(address(upkeep), linkToken.balanceOf(address(this)));

        ssvToken.approve(address(ssvNetwork), ssvFees);

        ssvNetwork.registerValidator(
            pool.publicKey,
            pool.operatorIds,
            pool.shares,
            ssvFees,
            cluster
        );

        emit PoolDepositInitiated(poolId);
    }

    /**
     * @notice Complete a given count of the next pending pools
     * @param count The number of pools to complete
     */
    function completePoolDeposits(uint256 count) external onlyUpkeep() {
        require(pendingPoolIds.length >= count, "Not enough pending pools");

        while (count > 0) {
            count--;

            uint32 poolId = pendingPoolIds[0];
            pendingPoolIds.remove(0);
            stakedPoolIds.push(poolId);

            emit PoolDeposited(poolId);
        }
    }

    /**
     * @notice Request a given count of staked pool exits
     * @param count The number of exits to request
     */
    function requestPoolExits(uint256 count) private {
        uint256 index = 0;
        while (count > 0) {
            uint32 poolId = stakedPoolIds[index];
            Pool storage pool = pools[poolId];

            if (!pool.exiting) {
                count--;
                index++;

                pool.exiting = true;
                exitingPoolCount++;

                emit PoolExitRequested(poolId);
            }
        }
    }

    /**
     * @notice Request a given count of pool unexpected exit reports
     * @param count The number of pool unexpected exit reports
     */
    function requestPoolUnexpectedExitReports(uint256 count) external onlyUpkeep() {
        requestedPoolUnexpectedExitReports = count;

        emit PoolUnexpectedExitReportsRequested(count);
    }

    /**
     * @notice Request a given count of pool slashed exit reports
     * @param count The number of pool slashed exit reports
     */
    function requestPoolSlashedExitReports(uint256 count) external onlyUpkeep() {
        requestedPoolSlashedExitReports = count;

        emit PoolSlashedExitReportsRequested(count);
    }

    /**
     * @notice Request a given count of pool exit completions
     * @param count The number of pool exits to complete
     */
    function requestPoolWithdrawnExitReports(uint256 count) external onlyUpkeep() {
        requestedPoolWithdrawnExitReports = count;

        emit PoolWithdrawnExitReportsRequested(count);
    }

    /**
     * @notice Report a pool unexpected exit
     * @param poolId The pool ID
     */
    function reportPoolUnexpectedExit(uint32 poolId) external onlyOracle() {
        require(
            requestedPoolUnexpectedExitReports > 0, 
            "No requested pool unexpected exit reports"
        );
        Pool storage pool = pools[poolId];
        require(!pool.exiting, "Pool is already exiting");

        requestedPoolUnexpectedExitReports -= 1;
        pool.exiting = true;
        exitingPoolCount++;
    }

    /**
     * @notice Report a pool slash
     * @param poolId The pool ID
     */
    function reportPoolSlash(uint32 poolId) external onlyOracle() {
        require(
            requestedPoolSlashedExitReports > 0, 
            "No requested pool slash reports"
        );
        Pool storage pool = pools[poolId];
        require(!pool.slashed, "Pool is already slashed");

        requestedPoolSlashedExitReports -= 1;
        pool.slashed = true;
        slashedPoolCount++;
        if (!pool.exiting) {
            pool.exiting = true;
            exitingPoolCount++;
        }
    }

    /**
     * @notice Complete a pool exit
     * @param poolIndex The staked pool index
     * @param finalEffectiveBalance The final effective balance
     * @param blamePercents The operator blame percents (0 if balance is 32 ether)
     * @param cluster The SSV cluster snapshot
     */
    function completePoolExit(
        uint256 poolIndex,
        uint256 finalEffectiveBalance,
        uint32[] memory blamePercents,
        ISSVNetworkCore.Cluster memory cluster
    ) external onlyOracle() {
        require(
            requestedPoolWithdrawnExitReports > 0, 
            "No requested pool withdrawn exit reports"
        );

        requestedPoolWithdrawnExitReports -= 1;
        uint32 poolId = stakedPoolIds[poolIndex];
        Pool storage pool = pools[poolId];
        uint64[] memory operatorIds = pool.operatorIds;
        bytes memory publicKey = pool.publicKey;

        // Todo recover lost funds from collateral using blame percents

        depositedPoolCount--;
        exitingPoolCount--;
        if (pool.slashed) {
            slashedPoolCount--;
        }

        exitedBalance += finalEffectiveBalance;
        reportFinalizableWithdrawnBalance += finalEffectiveBalance;
        finalizableWithdrawnPoolCount++;

        stakedPoolIds.remove(poolIndex);
        delete pools[poolId];

        ssvNetwork.removeValidator(publicKey, operatorIds, cluster);

        emit PoolExited(poolId);
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
     * @dev Process fees
     * @param amount The amount of ETH to process
     * @return linkFees The amount of swapped LINK fees
     * @return ssvFees The amount of swapped SSV fees
     */
    function processFees(
        uint256 amount
    ) private returns (uint256 linkFees, uint256 ssvFees) {
        wrapFees(amount);

        (uint256 swappedLINK, uint256 unswappedLINK) = swapFees(
            tokenAddresses[Token.WETH],
            tokenAddresses[Token.LINK],
            Math.mulDiv(amount, linkFeePercent, feePercent)
        );
        linkFees = swappedLINK;
        unswappedTokens[tokenAddresses[Token.LINK]] += unswappedLINK;

        (uint256 swappedSSV, uint256 unswappedSSV) = swapFees(
            tokenAddresses[Token.WETH],
            tokenAddresses[Token.SSV],
            Math.mulDiv(amount, ssvFeePercent, feePercent)
        );
        ssvFees = swappedSSV;
        unswappedTokens[tokenAddresses[Token.SSV]] += unswappedSSV;
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
     * @param tokenIn The token to swap in
     * @param tokenOut The token to swap out
     * @param amountIn The amount of token in
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
     * @dev Update fee percentages
     * @param _ethFeePercent The new ETH fee percentage
     * @param _linkFeePercent The new LINK fee percentage
     * @param _ssvFeePercent The new SSV fee percentage
     */
    function setFeePercents(
        uint32 _ethFeePercent,
        uint32 _linkFeePercent,
        uint32 _ssvFeePercent
    ) external onlyOwner {
        require(
            _ethFeePercent + _linkFeePercent + _ssvFeePercent ==
                getFeePercent(),
            "Total fee percentage must remain the same"
        );

        ethFeePercent = _ethFeePercent;
        linkFeePercent = _linkFeePercent;
        ssvFeePercent = _ssvFeePercent;
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
            pendingWithdrawals;
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
     * @notice Get the pending balance
     * @return pendingBalance The pending balance
     */
    function getPendingBalance() public view returns (uint256 pendingBalance) {
        pendingBalance = pendingPoolIds.length * poolCapacity;
    }

    /**
     * @notice Get the withdrawable balanace
     * @return withdrawableBalance The withdrawable balanace
     */
    function getWithdrawableBalance() public view returns (uint256) {
        return prepoolBalance + exitedBalance;
    }

    /**
     * @notice Get the reserved fees
     * @return reservedFees The reserved fees
     */
    function getReservedFees() public view returns (uint256) {
        return reservedFees;
    }

    /**
     * @notice Get the swept balance
     * @return balance The swept balance
     */
    function getSweptBalance() public view returns (uint256 balance) {
        balance =
            address(this).balance -
            getBufferedBalance() -
            getReservedFees();
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
     * @notice Get the report period
     * @return reportPeriod The report period
     */
    function getReportPeriod() public view returns (uint32) {
        return reportPeriod;
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
     * @notice Get the latest active rewards
     * @return latestRewards The latest active rewards
     */
    function getLatestActiveRewards() public view returns (int256) {
        return latestRewards;
    }

    /**
     * @notice Get the finalizable withdrawn balance of the current reporting period
     * @return reportFinalizableWithdrawnBalance The finalizable withdrawn balance of the current reporting period
     */
    function getReportFinalizableWithdrawnBalance() public view returns (uint256) {
        return reportFinalizableWithdrawnBalance;
    }

    /**
     * @notice Get the finalizable withdrawn pool count of the current reporting period
     * @return finalizableWithdrawnPoolCount The finalizable withdrawn pool count of the current reporting period
     */
    function getFinalizableWithdrawnPoolCount() public view returns (uint256) {
        return finalizableWithdrawnPoolCount;
    }

    /**
     * @notice Get the pending withdrawal queue
     * @return pendingWithdrawalQueue The pending withdrawal queue
     */
    function getPendingWithdrawalQueue()
        public
        view
        returns (Withdrawal[] memory)
    {
        return pendingWithdrawalQueue;
    }

    /**
     * @notice Get the eligibility of a pending withdrawal
     * @return pendingWithdrawalEligibility The eligibility of a pending withdrawal
     */
    function getPendingWithdrawalEligibility(
        uint256 index,
        uint256 period
    ) public view returns (bool) {
        if (pendingWithdrawalCount > index) {
            return pendingWithdrawalQueue[index].period <= period;
        }
        return false;
    }

    /**
     * @notice Get the total pending withdrawals
     * @return pendingWithdrawals The total pending withdrawals
     */
    function getPendingWithdrawals() public view returns (uint256) {
        return pendingWithdrawals;
    }

    /**
     * @notice Get the total pending withdrawal count
     * @return pendingWithdrawalCount The total pending withdrawal count
     */
    function getPendingWithdrawalCount() public view returns (uint256) {
        return pendingWithdrawalCount;
    }

    /**
     * @notice Get the total fee percentage
     * @return feePercent The total fee percentage
     */
    function getFeePercent() public view returns (uint32) {
        return feePercent;
    }

    // External view functions

    /**
     * @notice Get the count of active pools
     * @return depositedPoolCount The count of active pools
     */
    function getDepositedPoolCount() external view returns (uint256) {
        return depositedPoolCount;
    }

    /**
     * @notice Get the count of exiting pools
     * @return exitingPoolCount The count of exiting pools
     */
    function getExitingPoolCount() external view returns (uint256) {
        return exitingPoolCount;
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
     * @notice Get a pool by ID
     * @param poolId The pool ID
     * @return pool The pool details
     */
    function getPool(uint32 poolId) external view returns (Pool memory pool) {
        pool = pools[poolId];
    }

    /**
     * @notice Get the ETH fee percentage to charge on each deposit
     * @return ethFeePercent The ETH fee percentage to charge on each deposit
     */
    function getETHFeePercent() external view returns (uint32) {
        return ethFeePercent;
    }

    /**
     * @notice Get the LINK fee percentage to charge on each deposit
     * @return linkFeePercent The LINK fee percentage to charge on each deposit
     */
    function getLINKFeePercent() external view returns (uint32) {
        return linkFeePercent;
    }

    /**
     * @notice Get the SSV fee percentage to charge on each deposit
     * @return ssvFeePercent The SSV fee percentage to charge on each deposit
     */
    function getSSVFeePercent() external view returns (uint32) {
        return ssvFeePercent;
    }

    /**
     * @notice Get the upkeep address
     * @return upkeepAddress The upkeep address
     */
    function getUpkeepAddress() external view returns (address upkeepAddress) {
        upkeepAddress = address(upkeep);
    }
}
