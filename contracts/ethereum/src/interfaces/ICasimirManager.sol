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
        uint256 distributionSum0;
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
    }

    /**********/
    /* Events */
    /**********/

    event PoolIncreased(
        address indexed sender,
        uint32 poolId,
        uint256 amount
    );
    event PoolStaked(uint32 indexed poolId);
    event PoolExitRequested(uint32 indexed poolId);
    event PoolExited(uint32 indexed poolId);
    event RewardDistributed(
        address indexed sender,
        uint256 amount
    );
    event UserDepositDistributed(
        address indexed sender,
        uint256 amount
    );
    event UserWithdrawalRequested(
        address indexed sender,
        uint256 amount
    );
    event UserWithdrawalInitiated(
        address indexed sender,
        uint256 amount
    );
    event UserWithdrawed(
        address indexed sender,
        uint256 amount
    );
    event ValidatorAdded(bytes indexed publicKey);

    /*************/
    /* Functions */
    /*************/

    function deposit() external payable;

    function reward(uint256 amount) external;

    function withdraw(uint256 amount) external;

    function stakeNextPool() external;

    function requestPoolExit(uint32 poolId) external;

    function completePoolExit(uint256 poolIndex, uint256 stakedValidatorIndex, uint256 exitingValidatorIndex) external;

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

    function getStakedValidatorPublicKeys()
        external
        view
        returns (bytes[] memory);

    function getReadyValidatorPublicKeys()
        external
        view
        returns (bytes[] memory);

    function getReadyPoolIds() external view returns (uint32[] memory);

    function getStakedPoolIds() external view returns (uint32[] memory);

    function getStake() external view returns (uint256);

    function getExecutionStake() external view returns (int256);

    function getExecutionSwept() external view returns (int256);

    function getExpectedConsensusStake() external view returns (int256);

    function getOpenDeposits() external view returns (uint256);

    function getUserStake(address userAddress) external view returns (uint256);
}
