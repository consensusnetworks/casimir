// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './interfaces/ICasimirViews.sol';
import './interfaces/ICasimirManager.sol';
import './interfaces/ICasimirRegistry.sol';

/**
 * @title Views contract that provides read-only access to the state
 */
contract CasimirViews is ICasimirViews {
    /*************/
    /* Constants */
    /*************/

    /** Compound minimum (0.1 ETH) */
    uint256 private constant compoundMinimum = 100000000 gwei;

    /*************/
    /* Immutable */
    /*************/

    /** Manager contract */
    ICasimirManager private immutable manager;
    /** Registry contract */
    ICasimirRegistry private immutable registry;

    /**
     * @notice Constructor
     * @param managerAddress The manager address
     * @param registryAddress The registry address
     */
    constructor(address managerAddress, address registryAddress) {
        manager = ICasimirManager(managerAddress);
        registry = ICasimirRegistry(registryAddress);
    }

    /**
     * @notice Get the next five compoundable pool IDs
     * @dev Should be called off-chain
     * @param startIndex The start index
     * @param endIndex The end index
     * @return poolIds The next five compoundable pool IDs
     */
    function getCompoundablePoolIds(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (uint32[5] memory poolIds) {
        uint32[] memory pendingPoolIds = manager.getPendingPoolIds();
        uint32[] memory stakedPoolIds = manager.getStakedPoolIds();
        uint256 count = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint32 poolId;
            if (i < pendingPoolIds.length) {
                poolId = pendingPoolIds[i];
            } else {
                poolId = stakedPoolIds[i - pendingPoolIds.length];
            }
            ICasimirPool pool = ICasimirPool(manager.getPoolAddress(poolId));
            if (pool.getBalance() >= compoundMinimum) {
                poolIds[count] = poolId;
                count++;
                if (count == 5) {
                    break;
                }
            }
        }
    }

    /**
     * @notice Get the deposited pool count
     * @return depositedPoolCount The deposited pool count
     */
    function getDepositedPoolCount() external view returns (uint256 depositedPoolCount) {
        return manager.getPendingPoolIds().length + manager.getStakedPoolIds().length;
    }

    /**
     * @notice Get operators
     * @param startIndex The start index
     * @param endIndex The end index 
     * @return operators The operators
     */
    function getOperators(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (ICasimirRegistry.Operator[] memory) {
        ICasimirRegistry.Operator[] memory operators = new ICasimirRegistry.Operator[](endIndex - startIndex);
        uint64[] memory operatorIds = registry.getOperatorIds();
        uint256 count = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint64 operatorId = operatorIds[i];
            operators[count] = registry.getOperator(operatorId);
            count++;
        }
        return operators;
    }

    /**
     * @notice Get a pool's details by ID
     * @param poolId The pool ID
     * @return poolDetails The pool details
     */
    function getPoolDetails(uint32 poolId) external view returns (ICasimirPool.PoolDetails memory poolDetails) {
        address poolAddress = manager.getPoolAddress(poolId);
        if (poolAddress != address(0)) {
            ICasimirPool pool = ICasimirPool(poolAddress);
            poolDetails = pool.getDetails();
        }
    }

    /**
     * @notice Get the swept balance
     * @dev Should be called off-chain
     * @param startIndex The start index
     * @param endIndex The end index
     * @return sweptBalance The swept balance
     */
    function getSweptBalance(
        uint256 startIndex,
        uint256 endIndex
    ) public view returns (uint128 sweptBalance) {
        for (uint256 i = startIndex; i <= endIndex; i++) {
            uint32[] memory stakedPoolIds = manager.getStakedPoolIds();
            uint32 poolId = stakedPoolIds[i];
            ICasimirPool pool = ICasimirPool(manager.getPoolAddress(poolId));
            sweptBalance += uint128(pool.getBalance() / 1 gwei);
        }
    }

    /**
     * @notice Get the validator public keys
     * @param startIndex The start index
     * @param endIndex The end index
     * @return validatorPublicKeys The validator public keys
     */
    function getValidatorPublicKeys(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (bytes[] memory) {
        bytes[] memory validatorPublicKeys = new bytes[](endIndex - startIndex);
        uint32[] memory pendingPoolIds = manager.getPendingPoolIds();
        uint32[] memory stakedPoolIds = manager.getStakedPoolIds();
        uint256 count = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint32 poolId;
            if (i < pendingPoolIds.length) {
                poolId = pendingPoolIds[i];
            } else {
                poolId = stakedPoolIds[i - pendingPoolIds.length];
            }
            address poolAddress = manager.getPoolAddress(poolId);
            ICasimirPool pool = ICasimirPool(poolAddress);
            validatorPublicKeys[count] = pool.publicKey();
            count++;
        }
        return validatorPublicKeys;
    }
}