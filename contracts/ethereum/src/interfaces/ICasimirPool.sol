// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

interface ICasimirPool {
    /***********/
    /* Structs */
    /***********/

    /** Pool config */
    struct PoolConfig {
        uint32 poolId;
        bytes publicKey;
        uint64[] operatorIds;
        PoolStatus status;
    }

    /** Pool status */
    enum PoolStatus {
        PENDING,
        ACTIVE,
        EXITING_FORCED,
        EXITING_REQUESTED,
        WITHDRAWN
    }

    /*************/
    /* Functions */
    /*************/

    function depositRewards() external;

    function withdrawBalance(uint32[] memory blamePercents) external;

    function setOperatorIds(uint64[] memory operatorIds) external;
    
    function setStatus(PoolStatus status) external;

    function getBalance() external view returns (uint256);

    function getConfig() external view returns (PoolConfig memory);

    function getOperatorIds() external view returns (uint64[] memory);

    function getPublicKey() external view returns (bytes memory);   

    function getStatus() external view returns (PoolStatus);
}