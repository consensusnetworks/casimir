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
    /** Token fees required for contract protocols */
    struct Fees {
        uint32 LINK;
        uint32 SSV;
    }
    /** Pool used for running a validator */
    struct Pool {
        uint256 deposits;
        bytes validatorPublicKey;
        bool exiting;
    }
    /** Pool with details */
    struct PoolDetails {
        uint256 deposits;
        bytes validatorPublicKey;
        uint32[] operatorIds;
        bool exiting;
    }
    /** User staking account */
    struct User {
        uint256 stake0;
        uint256 rewardRatioSum0;
    }
    /** Withdrawal */
    struct Withdrawal {
        address user;
        uint256 amount;
    }
    /** Validator deposit data and shares */
    struct Validator {
        bytes32 depositDataRoot;
        uint32[] operatorIds;
        bytes[] sharesEncrypted;
        bytes[] sharesPublicKeys;
        bytes signature;
        bytes withdrawalCredentials;
        uint256 reshareCount;
    }

    /**********/
    /* Events */
    /**********/

    event PoolFilled(address sender, uint32 poolId);
    event PoolInitiated(uint32 poolId);
    event PoolCompleted(uint32 poolId);
    event PoolExitRequested(uint32 poolId);
    event PoolExited(uint32 poolId);
    event StakeDistributed(address sender, uint256 amount);
    event StakeRebalanced(address sender, uint256 amount);
    event WithdrawalRequested(address sender, uint256 amount);
    event WithdrawalInitiated(address sender, uint256 amount);
    event WithdrawalCompleted(address sender, uint256 amount);
    event ValidatorRegistered(bytes publicKey);
    event ValidatorReshared(bytes publicKey);

    /*************/
    /* Functions */
    /*************/

    function depositStake() external payable;

    function rebalanceStake(uint256 activeStake, uint256 sweptRewards) external;

    function requestWithdrawal(uint256 amount) external;

    function initiateRequestedWithdrawals(uint256 count) external;

    function completePendingWithdrawals(uint256 count) external;

    function initiateReadyPools(uint256 count) external;

    function completePendingPools(uint256 count) external;

    function requestPoolExits(uint256 count) external;

    function completePoolExit(
        uint256 poolIndex,
        uint256 validatorIndex
    ) external;

    function registerValidator(
        bytes32 depositDataRoot,
        bytes calldata publicKey,
        uint32[] memory operatorIds,
        bytes[] memory sharesEncrypted,
        bytes[] memory sharesPublicKeys,
        bytes calldata signature,
        bytes calldata withdrawalCredentials
    ) external;

    function setLINKFee(uint32 fee) external;

    function setSSVFee(uint32 fee) external;

    function setOracleAddress(address oracleAddress) external;

    function getFees() external view returns (Fees memory);

    function getLINKFee() external view returns (uint32);

    function getSSVFee() external view returns (uint32);

    function getReadyValidatorPublicKeys()
        external
        view
        returns (bytes[] memory);

    function getStakedValidatorPublicKeys()
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

    function getSweptStake() external view returns (uint256);

    function getActiveStake() external view returns (uint256);

    function getOpenDeposits() external view returns (uint256);

    function getUserStake(address userAddress) external view returns (uint256);

    function getRequestedWithdrawals() external view returns (uint256);

    function getPendingWithdrawals() external view returns (uint256);

    function getRequestedWithdrawalQueue() external view returns (Withdrawal[] memory);

    function getPendingWithdrawalQueue() external view returns (Withdrawal[] memory);
}
