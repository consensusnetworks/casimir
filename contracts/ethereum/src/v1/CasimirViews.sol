// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import './interfaces/ICasimirViews.sol';
import './interfaces/ICasimirManager.sol';

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

    constructor(address managerAddress) {
        manager = ICasimirManager(managerAddress);
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
        for (uint256 i = startIndex; i <= endIndex; i++) {
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