// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface ICasimirManager {
    /***********/
    /* Structs */
    /***********/

    /** Processed deposit with stake and fee amounts */
    struct ProcessedDeposit {
        uint256 ethAmount;
        uint256 linkAmount;
        uint256 ssvAmount;
    }
    /** Pool used for running a validator */
    struct Pool {
        uint256 deposits;
        bool exiting;
        uint256 reshareCount;
        bytes32 depositDataRoot;
        bytes publicKey;
        uint32[] operatorIds;
        bytes[] sharesEncrypted;
        bytes[] sharesPublicKeys;
        bytes signature;
        bytes withdrawalCredentials;
    }
    /** User staking account */
    struct User {
        uint256 stake0;
        uint256 stakeRatioSum0;
    }
    /** Withdrawal */
    struct Withdrawal {
        address user;
        uint256 amount;
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
        uint256 activeStake, 
        uint256 sweptRewards, 
        uint256 sweptExits,
        uint32 depositCount,
        uint32 exitCount
    ) external;

    function requestWithdrawal(uint256 amount) external;

    function initiateRequestedWithdrawals(uint256 count) external;

    function completePendingWithdrawals(uint256 count) external;

    function initiatePoolDeposit(        
        bytes32 depositDataRoot,
        bytes calldata publicKey,
        uint32[] memory operatorIds,
        bytes[] memory sharesEncrypted,
        bytes[] memory sharesPublicKeys,
        bytes calldata signature,
        bytes calldata withdrawalCredentials,
        uint256 feeAmount
    ) external;

    function requestPoolExits(uint256 count) external;

    function completePoolExit(
        uint256 poolIndex,
        uint256 validatorIndex
    ) external;

    function setFeePercents(uint32 ethFeePercent, uint32 linkFeePercent, uint32 ssvFeePercent) external;

    function setOracleAddress(address oracleAddress) external;

    function getFeePercent() external view returns (uint32);

    function getETHFeePercent() external view returns (uint32);

    function getLINKFeePercent() external view returns (uint32);

    function getSSVFeePercent() external view returns (uint32);

    function getValidatorPublicKeys()
        external
        view
        returns (bytes[] memory);

    function getExitingValidatorCount()
        external
        view
        returns (uint256);

    function getReadyPoolIds() external view returns (uint32[] memory);

    function getPendingPoolIds() external view returns (uint32[] memory);

    function getStakedPoolIds() external view returns (uint32[] memory);

    function getStake() external view returns (uint256);

    function getBufferedStake() external view returns (uint256);

    function getActiveStake() external view returns (uint256);

    function getOpenDeposits() external view returns (uint256);

    function getUserStake(address userAddress) external view returns (uint256);

    function getRequestedWithdrawals() external view returns (uint256);

    function getPendingWithdrawals() external view returns (uint256);

    function getRequestedWithdrawalQueue() external view returns (Withdrawal[] memory);

    function getPendingWithdrawalQueue() external view returns (Withdrawal[] memory);
}
