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
    /** User withdrawal */
    struct UserWithdrawal {
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

    event DistributionRebalanced(address indexed sender, uint256 amount);
    event PoolIncreased(address indexed sender, uint32 poolId, uint256 amount);
    event PoolStaked(uint32 indexed poolId);
    event PoolExitRequested(uint32 indexed poolId);
    event PoolExited(uint32 indexed poolId);
    event StakeDistributed(address indexed sender, uint256 amount);
    event StakeWithdrawalRequested(address indexed sender, uint256 amount);
    event StakeWithdrawalInitiated(address indexed sender, uint256 amount);
    event StakeWithdrawn(address indexed sender, uint256 amount);
    event RewardDistributed(address indexed sender, uint256 amount);
    event ValidatorRegistered(bytes indexed publicKey);
    event ValidatorReshared(bytes indexed publicKey);

    /*************/
    /* Functions */
    /*************/

    function deposit() external payable;

    function rebalance(uint256 activeStake, uint256 sweptRewards) external;

    function withdraw(uint256 amount) external;

    function stakeReadyPools() external;

    function completePendingPools() external;

    function requestNextPoolExit() external;

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

    function getQueuedStake() external view returns (uint256);

    function getSweptStake() external view returns (uint256);

    function getActiveStake() external view returns (uint256);

    function getOpenDeposits() external view returns (uint256);

    function getUserStake(address userAddress) external view returns (uint256);

    function getRequestedWithdrawals() external view returns (uint256);

    function getPendingWithdrawals() external view returns (uint256);

}
