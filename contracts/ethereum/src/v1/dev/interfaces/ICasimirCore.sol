// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

/// @title Core interface
interface ICasimirCoreDev {
    /// @dev Manager configuration
    struct ManagerConfig {
        address managerAddress;
        address registryAddress;
        address upkeepAddress;
        address viewsAddress;
        Strategy strategy;
    }

    /// @dev Registered operator
    struct Operator {
        uint64 id;
        bool active;
        uint256 collateral;
        uint256 poolCount;
        bool resharing;
    }

    /// @dev Pool config
    struct PoolConfig {
        address poolAddress;
        uint256 balance;
        uint64[] operatorIds;
        bytes publicKey;
        uint256 reshares;
        PoolStatus status;
    }

    /// @dev Pool registration
    struct PoolRegistration {
        uint64[] operatorIds;
        bytes publicKey;
        bytes shares;
        PoolStatus status;
    }

    /// @dev Pool status
    enum PoolStatus {
        READY,
        PENDING,
        ACTIVE,
        EXITING_FORCED,
        EXITING_REQUESTED,
        WITHDRAWN
    }

    /// @dev Staking strategy
    struct Strategy {
        uint256 minCollateral;
        uint256 lockPeriod;
        uint32 userFee;
        bool compoundStake;
        bool eigenStake;
        bool liquidStake;
        bool privateOperators;
        bool verifiedOperators;
    }

    /// @dev User stake account
    struct User {
        uint256 stake0;
        uint256 stakeRatioSum0;
    }

    /// @dev User withdrawal request
    struct Withdrawal {
        address userAddress;
        uint256 amount;
        uint256 period;
    }

    error InvalidAddress();
    error InvalidAmount();
    error PoolAlreadyInitiated();
    error PoolAlreadyWithdrawn();
    error PoolMaxReshared();
    error PoolNotActive();
    error PoolNotPending();
    error PoolNotExiting();
    error TransferFailed();
    error Unauthorized();
}
