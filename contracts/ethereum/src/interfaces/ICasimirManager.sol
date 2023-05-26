// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "../vendor/interfaces/ISSVNetwork.sol";

interface ICasimirManager {
    /***********/
    /* Structs */
    /***********/

    struct ProcessedDeposit {
        uint256 ethAmount;
        uint256 linkAmount;
        uint256 ssvAmount;
    }

    struct Pool {
        uint256 deposits;
        bool exiting;
        bool slashed;
        bytes32 depositDataRoot;
        bytes publicKey;
        bytes signature;
        bytes withdrawalCredentials;
        uint64[] operatorIds;
        bytes shares;
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

    event PoolDepositRequested(uint32 poolId);
    event PoolDepositInitiated(uint32 poolId);
    event PoolDeposited(uint32 poolId);
    event PoolReshareRequested(uint32 poolId);
    event PoolReshared(uint32 poolId);
    event PoolExitRequested(uint32 poolId);
    event PoolExited(uint32 poolId);
    event StakeDeposited(address sender, uint256 amount);
    event StakeRebalanced(uint256 amount);
    event RewardsDeposited(uint256 amount);
    event WithdrawalRequested(address sender, uint256 amount);
    event WithdrawalInitiated(address sender, uint256 amount);
    event WithdrawalCompleted(address sender, uint256 amount);

    /*************/
    /* Functions */
    /*************/

    function depositStake() external payable;

    function rebalanceStake(
        uint256 activeBalance, 
        uint256 newSweptRewards, 
        uint256 newDeposits,
        uint256 newExits
    ) external;

    function requestWithdrawal(uint256 amount) external;

    function completePendingWithdrawals(uint256 count) external;

    function initiatePoolDeposit(        
        bytes32 depositDataRoot,
        bytes calldata publicKey,
        bytes calldata signature,
        bytes calldata withdrawalCredentials,
        uint64[] memory operatorIds,
        bytes calldata shares,
        ISSVNetworkCore.Cluster memory cluster,
        uint256 feeAmount
    ) external;

    function completePoolDeposits(uint256 count) external;

    function completePoolExit(
        uint256 poolIndex,
        uint256 finalEffectiveBalance,
        uint32[] memory blamePercents,
        ISSVNetworkCore.Cluster memory cluster
    ) external;

    function setFeePercents(uint32 ethFeePercent, uint32 linkFeePercent, uint32 ssvFeePercent) external;

    function setFunctionsAddress(address functionsAddress) external;

    function getFeePercent() external view returns (uint32);

    function getETHFeePercent() external view returns (uint32);

    function getLINKFeePercent() external view returns (uint32);

    function getSSVFeePercent() external view returns (uint32);

    function getDepositedPoolCount()
        external
        view
        returns (uint256);

    function getExitingPoolCount()
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

    function getFinalizableExitedPoolCount() external view returns (uint256);

    function getFinalizableExitedBalance() external view returns (uint256);

    function getLatestActiveBalance() external view returns (uint256);

    function getLatestActiveBalanceAfterFees() external view returns (uint256);

    function getPendingWithdrawalEligibility(uint256 index, uint256 period) external view returns (bool);

    function getWithdrawableBalance() external view returns (uint256);

    function getPrepoolBalance() external view returns (uint256);

    function getSweptBalance() external view returns (uint256);

    function getUserStake(address userAddress) external view returns (uint256);

    function getPendingWithdrawalQueue() external view returns (Withdrawal[] memory);

    function getPendingWithdrawals() external view returns (uint256);

    function getPendingWithdrawalCount() external view returns (uint256);
}
