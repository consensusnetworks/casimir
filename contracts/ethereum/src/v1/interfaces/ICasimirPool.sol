// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

interface ICasimirPool {
    /***************/
    /* Enumerators */
    /***************/

    enum PoolStatus {
        PENDING,
        ACTIVE,
        EXITING_FORCED,
        EXITING_REQUESTED,
        WITHDRAWN
    }

    /**********/
    /* Events */
    /**********/

    event OperatorIdsSet(uint64[] operatorIds);
    event ResharesSet(uint256 reshares);
    event StatusSet(PoolStatus status);

    /***********/
    /* Structs */
    /***********/

    struct PoolDetails {
        uint32 id;
        uint256 balance;
        bytes publicKey;
        uint64[] operatorIds;
        uint256 reshares;
        ICasimirPool.PoolStatus status;
    }

    /*************/
    /* Mutations */
    /*************/

    function depositRewards() external;
    function withdrawBalance(uint32[] memory blamePercents) external;
    function setOperatorIds(uint64[] memory operatorIds) external;
    function setReshares(uint256 reshares) external;
    function setStatus(PoolStatus status) external;

    /***********/
    /* Getters */
    /***********/

    function id() external view returns (uint32);
    function publicKey() external view returns (bytes memory);
    function reshares() external view returns (uint256);
    function status() external view returns (PoolStatus);
    function getDetails() external view returns (PoolDetails memory);
    function getBalance() external view returns (uint256);
    function getOperatorIds() external view returns (uint64[] memory);
}