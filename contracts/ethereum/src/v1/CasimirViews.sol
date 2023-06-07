// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './interfaces/ICasimirViews.sol';
import './interfaces/ICasimirManager.sol';
import './interfaces/ICasimirRegistry.sol';

// Dev-only imports
import "hardhat/console.sol";

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
        uint32[] memory stakedPoolIds = manager.getStakedPoolIds();
        uint256 count = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint32 poolId = stakedPoolIds[i];
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
    function getPoolDetails(
        uint32 poolId
    ) external view returns (PoolDetails memory poolDetails) {
        address poolAddress = manager.getPoolAddress(poolId);
        if (poolAddress != address(0)) {
            ICasimirPool pool = ICasimirPool(poolAddress);
            ICasimirPool.PoolConfig memory poolConfig = pool.getConfig();
            poolDetails = PoolDetails({
                id: poolId,
                balance: pool.getBalance(),
                publicKey: poolConfig.publicKey,
                operatorIds: poolConfig.operatorIds,
                status: poolConfig.status
            });
        }
    }

    /**
     * @notice Get the swept balance
     * @dev Should be called off-chain
     * @param startIndex The start index
     * @param endIndex The end index
     * @return balance The swept balance
     */
    function getSweptBalance(
        uint256 startIndex,
        uint256 endIndex
    ) public view returns (uint256 balance) {
        for (uint256 i = startIndex; i <= endIndex; i++) {
            uint32[] memory stakedPoolIds = manager.getStakedPoolIds();
            uint32 poolId = stakedPoolIds[i];
            ICasimirPool pool = ICasimirPool(manager.getPoolAddress(poolId));
            balance += pool.getBalance();
        }
    }
}