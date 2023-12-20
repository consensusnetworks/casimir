// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./ICasimirCore.sol";
import "../vendor/interfaces/ISSVNetworkCore.sol";

interface ICasimirManager is ICasimirCore {
    event ClusterBalanceDeposited(uint256 amount);
    event ValidatorActivated(uint32 indexed poolId);
    event ValidatorInititated(uint32 indexed poolId);
    event ValidatorInitiationRequested(uint32 indexed poolId);
    event ValidatorReshared(uint32 indexed poolId);
    event ValidatorExited(uint32 indexed poolId);
    event ValidatorWithdrawn(uint32 indexed poolId);
    event LINKBalanceWithdrawn(uint256 amount);
    event WithdrawnBalanceDeposited(uint32 indexed poolId, uint256 amount);
    event StakeDeposited(address indexed sender, uint256 amount);
    event StakeRebalanced(uint256 amount);
    event RecoveredBalanceDeposited(uint32 indexed poolId, uint256 amount);
    event ReservedFeesDeposited(uint256 amount);
    event ReservedFeesWithdrawn(uint256 amount);
    event RewardsDeposited(uint256 amount);
    event SSVBalanceWithdrawn(uint256 amount);
    event TipsDeposited(uint256 amount);
    event FunctionsBalanceDeposited(uint256 amount);
    event UpkeepBalanceDeposited(uint256 amount);
    event FunctionsCancelled();
    event UpkeepCancelled();
    event WithdrawalFulfilled(address indexed sender, uint256 amount);
    event WithdrawalRequested(address indexed sender, uint256 amount);

    error Paused();
    error InvalidRebalance();
    error InsufficientLiquidity();
    error NoReadyPools();
    error ReportInProgress();

    /// @notice Deposit user stake
    function depositStake() external payable;

    /**
     * @notice Deposit pool rewards
     * @param poolId Pool ID
     */
    function depositRewards(uint32 poolId) external payable;

    /**
     * @notice Deposit pool withdrawn balance
     * @param poolId Pool ID
     */
    function depositWithdrawnBalance(uint32 poolId) external payable;

    /**
     * @notice Deposit pool operator recovered balance
     * @param poolId Pool ID
     */
    function depositRecoveredBalance(uint32 poolId) external payable;

    /// @notice Deposit reserved fees
    function depositReservedFees() external payable;

    /**
     * @notice Deposit to a cluster balance
     * @param operatorIds Operator IDs
     * @param cluster Cluster snapshot
     * @param feeAmount Fee amount to deposit
     * @param minTokenAmount Minimum SSV token amount out after processing fees
     * @param processed Whether the fee amount is already processed
     */
    function depositClusterBalance(
        uint64[] memory operatorIds,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 feeAmount,
        uint256 minTokenAmount,
        bool processed
    ) external;

    /**
     * @notice Deposit to the functions balance
     * @param feeAmount Fee amount to deposit
     * @param minTokenAmount Minimum LINK token amount out after processing fees
     * @param processed Whether the fee amount is already processed
     */
    function depositFunctionsBalance(uint256 feeAmount, uint256 minTokenAmount, bool processed) external;

    /**
     * @notice Deposit to the upkeep balance
     * @param feeAmount Fee amount to deposit
     * @param minTokenAmount Minimum LINK token amount out after processing fees
     * @param processed Whether the fee amount is already processed
     */
    function depositUpkeepBalance(uint256 feeAmount, uint256 minTokenAmount, bool processed) external;

    /**
     * @notice Rebalance the rewards to stake ratio and redistribute swept rewards
     * @param beaconBalance Beacon chain balance
     * @param sweptBalance Swept balance
     * @param withdrawnValidators Withdrawn validator count
     */
    function rebalanceStake(
        uint256 beaconBalance,
        uint256 sweptBalance,
        uint256 withdrawnValidators
    ) external;

    /**
     * @notice Compound pool rewards
     * @param poolIds Pool IDs
     */
    function compoundRewards(uint32[5] memory poolIds) external;

    /**
     * @notice Request to withdraw user stake
     * @param amount Withdrawal amount
     */
    function requestWithdrawal(uint256 amount) external;

    /**
     * @notice Fulfill pending withdrawals
     * @param count Withdrawal count
     */
    function fulfillWithdrawals(uint256 count) external;

    /**
     * @notice Initiate a validator with deposit data
     * @param depositDataRoot Deposit data root
     * @param publicKey Validator public key
     * @param signature Deposit signature
     * @param withdrawalCredentials Validator withdrawal credentials
     * @param operatorIds Operator IDs
     * @param shares Operator shares
     */
    function initiateValidator(
        bytes32 depositDataRoot,
        bytes memory publicKey,
        bytes memory signature,
        bytes memory withdrawalCredentials,
        uint64[] memory operatorIds,
        bytes memory shares
    ) external;

    /**
     * @notice Withdraw reserved fees
     * @param amount Amount to withdraw
     */
    function withdrawReservedFees(uint256 amount) external;

    /**
     * @notice Activate a validator with a cluster
     * @param pendingPoolIndex Pending pool index
     * @param cluster SSV cluster
     * @param feeAmount Fee amount
     * @param minTokenAmount Minimum token amount
     * @param processed Whether the fee has been processed
     */
    function activateValidator(
        uint256 pendingPoolIndex,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 feeAmount,
        uint256 minTokenAmount,
        bool processed
    ) external;

    /**
     * @notice Reshare a validator with a new cluster
     * @param poolId Pool ID
     * @param operatorIds Operator IDs
     * @param newOperatorId New operator ID
     * @param oldOperatorId Old operator ID
     * @param shares Operator shares
     * @param cluster Cluster snapshot
     * @param oldCluster Old cluster snapshot
     * @param feeAmount Fee amount to deposit
     * @param minTokenAmount Minimum SSV token amount out after processing fees
     * @param processed Whether the fee amount is already processed
     */
    function reshareValidator(
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
    ) external;

    /**
     * @notice Deactivate a withdrawn validator
     * @param stakedPoolIndex Staked pool index
     * @param blamePercents Operator blame percents (0 if balance is 32 ether)
     * @param cluster Cluster snapshot
     */
    function withdrawValidator(
        uint256 stakedPoolIndex,
        uint32[] memory blamePercents,
        ISSVNetworkCore.Cluster memory cluster
    ) external;

    /**
     * @notice Reset functions subscription
     */
    function resetFunctions() external;

    /**
     * @notice Pause or unpause the contract
     * @param paused Whether the contract is paused
     */
    function setPaused(bool paused) external;

    /**
     * @notice Withdraw cluster balance
     * @param operatorIds Operator IDs
     * @param cluster Cluster snapshot
     * @param amount Amount to withdraw
     */
    function withdrawClusterBalance(
        uint64[] memory operatorIds,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 amount
    ) external;

    /**
     * @notice Withdraw LINK balance
     * @param amount Amount to withdraw
     */
    function withdrawLINKBalance(uint256 amount) external;

    /**
     * @notice Withdraw SSV balance
     * @param amount Amount to withdraw
     */
    function withdrawSSVBalance(uint256 amount) external;

    /// @notice Cancel the Chainlink functions subscription
    function cancelFunctions() external;

    /// @notice Cancel the Chainlink upkeep subscription
    function cancelUpkeep() external;

    /// @notice User stake lock period
    function lockPeriod() external view returns (uint256);

    /// @notice User stake fee percentage
    function userFee() external view returns (uint32);

    /// @notice Whether eigen stake is enabled
    function eigenStake() external view returns (bool);

    /// @notice Whether liquid stake is enabled
    function liquidStake() external view returns (bool);

    /// @notice Chainlink functions subscription ID
    function functionsId() external view returns (uint64);

    /// @notice Chainlink upkeep subscription ID
    function upkeepId() external view returns (uint256);

    /// @notice Latest beacon chain balance
    function latestBeaconBalance() external view returns (uint256);

    /// @notice Reserved fee balance
    function reservedFeeBalance() external view returns (uint256);

    /// @notice Requested withdrawal balance
    function requestedWithdrawalBalance() external view returns (uint256);

    /// @notice Requested exit count
    function requestedExits() external view returns (uint256);
    
    /// @notice Fully reported activations in the current period (remove in the next deployment)
    function finalizableActivatedValidators() external view returns (uint256);

    /// @notice Fully reported completed exits in the current period
    function finalizableWithdrawnValidators() external view returns (uint256);

    /// @notice Current report period
    function reportPeriod() external view returns (uint32);

    /// @notice Get the total stake (buffered + beacon - requested withdrawals)
    function getTotalStake() external view returns (uint256);

    /// @notice Get the pending pool IDs
    function getPendingPoolIds() external view returns (uint32[] memory);

    /// @notice Get the staked pool IDs
    function getStakedPoolIds() external view returns (uint32[] memory);

    /**
     * @notice Get the eligibility of a pending withdrawal
     * @param index Index of the pending withdrawal
     * @param period Period to check
     */
    function getPendingWithdrawalEligibility(uint256 index, uint256 period) external view returns (bool);

    /// @notice Get the withdrawable balance (prepool + withdrawn)
    function getWithdrawableBalance() external view returns (uint256);

    /// @notice Get the stake ratio sum
    function getStakeRatioSum() external view returns (uint256);

    /**
     * @notice Get user stake
     * @param userAddress User address
     */
    function getUserStake(address userAddress) external view returns (uint256);

    /**
     * @notice Get a pool address
     * @param poolId Pool ID
     */
    function getPoolAddress(uint32 poolId) external view returns (address);

    /// @notice Get the registry address
    function getRegistryAddress() external view returns (address);

    /// @notice Get the upkeep address
    function getUpkeepAddress() external view returns (address);
}
