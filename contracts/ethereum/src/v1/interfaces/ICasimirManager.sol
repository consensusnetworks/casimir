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

    event DepositRequested(uint32 poolId);
    event DepositInitiated(uint32 poolId);
    event DepositActivated(uint32 poolId);
    event ResharesRequested(uint64 operatorId);
    event ReshareCompleted(uint32 poolId);
    event ExitRequested(uint32 poolId);
    event ForcedExitReportsRequested(uint256 count);
    event SlashedExitReportsRequested(uint256 count);
    event CompletedExitReportsRequested(uint256 count);
    event ExitCompleted(uint32 poolId);
    event StakeDeposited(address sender, uint256 amount);
    event StakeRebalanced(uint256 amount);
    event RewardsDeposited(uint256 amount);
    event TipsDeposited(uint256 amount);
    event WithdrawalRequested(address sender, uint256 amount);
    event WithdrawalInitiated(address sender, uint256 amount);
    event WithdrawalFulfilled(address sender, uint256 amount);

    /*************/
    /* Mutations */
    /*************/

    function depositStake() external payable;
    function depositRewards() external payable;
    function depositExitedBalance(uint32 poolId) external payable;
    function depositRecoveredBalance(uint32 poolId) external payable;
    function depositReservedFees() external payable;
    function depositClusterBalance(
        uint64[] memory operatorIds,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 feeAmount,
        bool processed
    ) external;
    function depositUpkeepBalance(
        uint256 feeAmount,
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
        bool processed
    ) external;
    function withdrawLINKBalance(uint256 amount) external;
    function withdrawSSVBalance(uint256 amount) external;
    function setFunctionsAddress(address functionsAddress) external;

    /***********/
    /* Getters */
    /***********/

    function upkeepId() external view returns (uint256);    
    function latestActiveBalance() external view returns (uint256);
    function feePercent() external view returns (uint32);
    function requestedWithdrawalBalance() external view returns (uint256);
    function finalizableCompletedExits() external view returns (uint256);
    function reportPeriod() external view returns (uint32);
    function getTotalStake() external view returns (uint256);
    function getReadyPoolIds() external view returns (uint32[] memory);
    function getPendingPoolIds() external view returns (uint32[] memory);
    function getStakedPoolIds() external view returns (uint32[] memory);
    function getBufferedBalance() external view returns (uint256);
    function getExpectedEffectiveBalance() external view returns (uint256);
    function getPendingWithdrawalEligibility(uint256 index, uint256 period) external view returns (bool);
    function getWithdrawableBalance() external view returns (uint256);
    function getUserStake(address userAddress) external view returns (uint256);
    function getPoolAddress(uint32 poolId) external view returns (address);
    function getRegistryAddress() external view returns (address);
    function getUpkeepAddress() external view returns (address);
    function getUpkeepBalance() external view returns (uint256 upkeepBalance);
}
