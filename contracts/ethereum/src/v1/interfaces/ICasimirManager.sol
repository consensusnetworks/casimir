// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './ICasimirPool.sol';
import "../vendor/interfaces/ISSVNetwork.sol";

interface ICasimirManager {
    /***************/
    /* Enumerators */
    /***************/

    enum Token {
        LINK,
        SSV,
        WETH
    }

    /***********/
    /* Structs */
    /***********/

    struct User {
        uint256 stake0;
        uint256 stakeRatioSum0;
        uint256 actionPeriodTimestamp;
        uint256 actionCount;
    }
    struct Withdrawal {
        address user;
        uint256 amount;
        uint256 period;
    }

    /**********/
    /* Events */
    /**********/

    event ClusterBalanceDeposited(uint256 amount);
    event DepositRequested(uint32 indexed poolId);
    event DepositInitiated(uint32 indexed poolId);
    event DepositActivated(uint32 indexed poolId);
    event ForcedExitsReported(uint32[] poolIds);
    event FunctionsRequestSet(bytes newRequestCBOR, uint32 newFulfillGasLimit);
    event FunctionsOracleAddressSet(address newFunctionsOracleAddress);
    event LINKBalanceWithdrawn(uint256 amount);
    event ResharesRequested(uint64 indexed operatorId);
    event ReshareCompleted(uint32 indexed poolId);
    event ExitedBalanceDeposited(uint32 indexed poolId, uint256 amount);
    event ExitRequested(uint32 indexed poolId);
    event ForcedExitReportsRequested(uint256 count);
    event SlashedExitReportsRequested(uint256 count);
    event CompletedExitReportsRequested(uint256 count);
    event ExitCompleted(uint32 indexed poolId);
    event PoolRegistered(uint32 poolId);
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
    event WithdrawalInitiated(address indexed sender, uint256 amount);

    /*************/
    /* Mutations */
    /*************/

    function depositStake() external payable;
    function depositRewards(uint32 poolId) external payable;
    function depositExitedBalance(uint32 poolId) external payable;
    function depositRecoveredBalance(uint32 poolId) external payable;
    function depositReservedFees() external payable;
    function depositClusterBalance(
        uint64[] memory operatorIds,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 feeAmount,
        uint256 minimumTokenAmount,
        bool processed
    ) external;
    function depositFunctionsBalance(
        uint256 feeAmount,
        uint256 minimumTokenAmount,
        bool processed
    ) external;
    function depositUpkeepBalance(
        uint256 feeAmount,
        uint256 minimumTokenAmount,
        bool processed
    ) external;
    function rebalanceStake(
        uint256 activeBalance, 
        uint256 sweptBalance, 
        uint256 activatedDeposits,
        uint256 completedExits
    ) external;
    function compoundRewards(uint32[5] memory poolIds) external;
    function requestWithdrawal(uint256 amount) external;
    function fulfillWithdrawals(uint256 count) external;
    function initiateDeposit(        
        bytes32 depositDataRoot,
        bytes calldata publicKey,
        bytes calldata signature,
        bytes calldata withdrawalCredentials,
        uint64[] memory operatorIds,
        bytes calldata shares,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 feeAmount,
        uint256 minimumTokenAmount,
        bool processed
    ) external;
    function activateDeposits(uint256 count) external;
    function requestForcedExitReports(uint256 count) external;
    function requestCompletedExitReports(uint256 count) external;
    function requestReshares(uint64 operatorId) external;
    function reportForcedExits(uint32[] memory poolIds) external;
    function reportCompletedExit(
        uint256 poolIndex,
        uint32[] memory blamePercents,
        ISSVNetworkCore.Cluster memory cluster
    ) external;
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
    ) external;
    function withdrawLINKBalance(uint256 amount) external;
    function withdrawSSVBalance(uint256 amount) external;
    function setFunctionsRequest(bytes calldata newRequestCBOR, uint32 newFulfillGasLimit) external;
    function setFunctionsOracleAddress(address newOracleAddress) external;
    function cancelFunctions() external;
    function cancelUpkeep() external;

    /***********/
    /* Getters */
    /***********/

    function functionsId() external view returns (uint64);
    function upkeepId() external view returns (uint256);    
    function latestActiveBalance() external view returns (uint256);
    function reservedFeeBalance() external view returns (uint256);
    function FEE_PERCENT() external view returns (uint32);
    function requestedWithdrawalBalance() external view returns (uint256);
    function requestedExits() external view returns (uint256);
    function finalizableCompletedExits() external view returns (uint256);
    function reportPeriod() external view returns (uint32);
    function getTotalStake() external view returns (uint256);
    function getReadyPoolIds() external view returns (uint32[] memory);
    function getPendingPoolIds() external view returns (uint32[] memory);
    function getStakedPoolIds() external view returns (uint32[] memory);
    function getBufferedBalance() external view returns (uint256);
    function getPendingWithdrawalEligibility(uint256 index, uint256 period) external view returns (bool);
    function getWithdrawableBalance() external view returns (uint256);
    function getUserStake(address userAddress) external view returns (uint256);
    function getPoolAddress(uint32 poolId) external view returns (address);
    function getRegistryAddress() external view returns (address);
    function getUpkeepAddress() external view returns (address);
}
