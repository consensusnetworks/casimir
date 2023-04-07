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
    /** SSV pool used for running a validator */
    struct Pool {
        uint256 deposits;
        uint32[] operatorIds;
        bytes validatorPublicKey;
    }
    /** User staking account */
    struct User {
        uint256 stake0;
        uint256 distributionSum0;
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

    event ManagerDistribution(address indexed sender, uint256 ethAmount, uint256 time);
    event PoolDeposit(address indexed sender, uint32 poolId, uint256 amount, uint256 time);
    event PoolStaked(uint32 indexed poolId, bytes validatorPublicKey, uint32[] operatorIds);
    event ValidatorAdded(bytes publicKey, uint32[] operatorIds);
    event ValidatorRemoved(bytes publicKey, uint32[] operatorIds);
    event UserWithdrawal(address indexed sender, uint256 ethAmount, uint256 time);

    /*************/
    /* Functions */
    /*************/

    function deposit() external payable;
    function withdraw(uint256 amount) external;
    function getFees() external view returns (Fees memory);
    function getLINKFee() external view returns (uint32);
    function getSSVFee() external view returns (uint32);
    function getStakedValidatorPublicKeys() external view returns (bytes[] memory);
    function getReadyValidatorPublicKeys() external view returns (bytes[] memory);
    function getReadyPoolIds() external view returns (uint32[] memory);
    function getStakedPoolIds() external view returns (uint32[] memory);
    function getStake() external view returns (uint256);
    function getReadyDeposits() external view returns (uint256);
    function getUserStake(address userAddress) external view returns (uint256);
}