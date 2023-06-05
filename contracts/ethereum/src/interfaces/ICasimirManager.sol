// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './ICasimirPool.sol';
import "../vendor/interfaces/ISSVNetwork.sol";

interface ICasimirManager {
    /***************/
    /* Enumerators */
    /***************/

    /** Token abbreviation */
    enum Token {
        LINK,
        SSV,
        WETH
    }

    /***********/
    /* Structs */
    /***********/

    struct PoolDetails {
        uint32 id;
        uint256 balance;
        bytes publicKey;
        uint64[] operatorIds;
        ICasimirPool.PoolStatus status;
    }

    struct User {
        uint256 stake0;
        uint256 stakeRatioSum0;
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
    event ReshareRequested(uint32 poolId);
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
    /* Functions */
    /*************/

    function depositStake() external payable;

    function depositRewards() external payable;

    function rebalanceStake(
        uint256 activeBalance, 
        uint256 sweptBalance, 
        uint256 activatedDeposits,
        uint256 completedExits
    ) external;

    function compoundRewards(uint32[5] memory poolIds) external;

    function depositExitedBalance(uint32 poolId) external payable;

    function depositRecoveredBalance(uint32 poolId) external payable;

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
        uint256 feeAmount
    ) external;

    function activateDeposits(uint256 count) external;

    function requestForcedExitReports(uint256 count) external;

    function requestCompletedExitReports(uint256 count) external;

    function reportCompletedExit(
        uint256 poolIndex,
        uint32[] memory blamePercents,
        ISSVNetworkCore.Cluster memory cluster
    ) external;

    function setFunctionsAddress(address functionsAddress) external;

    function getFeePercent() external view returns (uint32);

    function getTotalDeposits()
        external
        view
        returns (uint256);

    function getRequestedExits()
        external
        view
        returns (uint256);

    function getReadyPoolIds() external view returns (uint32[] memory);

    function getPendingPoolIds() external view returns (uint32[] memory);

    function getStakedPoolIds() external view returns (uint32[] memory);

    function getTotalStake() external view returns (uint256);

    function getBufferedBalance() external view returns (uint256);

    function getExpectedEffectiveBalance() external view returns (uint256);

    function getReportPeriod() external view returns (uint32);

    function getFinalizableCompletedExits() external view returns (uint256);

    function getFinalizableExitedBalance() external view returns (uint256);

    function getLatestActiveBalance() external view returns (uint256);

    function getLatestActiveBalanceAfterFees() external view returns (uint256);

    function getPendingWithdrawalEligibility(uint256 index, uint256 period) external view returns (bool);

    function getWithdrawableBalance() external view returns (uint256);

    function getPrepoolBalance() external view returns (uint256);

    function getSweptBalance() external view returns (uint256);

    function getUserStake(address userAddress) external view returns (uint256);

    function getPendingWithdrawalBalance() external view returns (uint256);

    function getPendingWithdrawals() external view returns (uint256);

    function getPoolAddress(uint32 poolId) external view returns (address);

    function getPoolDetails(uint32 poolId) external view returns (PoolDetails memory);

    function getRegistryAddress() external view returns (address);

    function getUpkeepAddress() external view returns (address);
}
