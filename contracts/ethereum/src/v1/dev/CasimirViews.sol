// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./interfaces/ICasimirManager.sol";
import "./interfaces/ICasimirPool.sol";
import "./interfaces/ICasimirRegistry.sol";
import "./interfaces/ICasimirUpkeep.sol";
import "./interfaces/ICasimirViews.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title Views contract that provides read-only access to the state
 */
contract CasimirViewsDev is ICasimirViewsDev, Initializable {
    /// @dev Compound minimum (0.1 ETH)
    uint256 private constant COMPOUND_MINIMUM = 100000000 gwei;
    /// @dev Manager contract
    ICasimirManagerDev private manager;
    /// @dev Storage gap
    uint256[50] private __gap;

    /**
     * @dev Constructor
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     * @param managerAddress Manager address
     */
    function initialize(address managerAddress) public initializer {
        manager = ICasimirManagerDev(managerAddress);
    }

    /// @inheritdoc ICasimirViewsDev
    function getCompoundablePoolIds(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (uint32[5] memory compoundablePoolIds) {
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
            if (manager.getPoolAddress(poolId).balance >= COMPOUND_MINIMUM) {
                compoundablePoolIds[count] = poolId;
                count++;
                if (count == 5) {
                    break;
                }
            }
        }
    }

    /// @inheritdoc ICasimirViewsDev
    function getDepositedPoolCount() external view returns (uint256 depositedPoolCount) {
        depositedPoolCount = manager.getPendingPoolIds().length + manager.getStakedPoolIds().length;
    }

    /// @inheritdoc ICasimirViewsDev
    function getDepositedPoolPublicKeys(uint256 startIndex, uint256 endIndex) external view returns (bytes[] memory) {
        bytes[] memory publicKeys = new bytes[](endIndex - startIndex);
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
            publicKeys[count] = ICasimirPoolDev(manager.getPoolAddress(poolId)).publicKey();
            count++;
        }
        return publicKeys;
    }

    /// @inheritdoc ICasimirViewsDev
    function getDepositedPoolStatuses(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (PoolStatus[] memory) {
        PoolStatus[] memory statuses = new PoolStatus[](endIndex - startIndex);
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
            statuses[count] = ICasimirPoolDev(manager.getPoolAddress(poolId)).status();
            count++;
        }
        return statuses;
    }

    /// @inheritdoc ICasimirViewsDev
    function getOperators(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (Operator[] memory) {
        Operator[] memory operators = new Operator[](endIndex - startIndex);
        ICasimirRegistryDev registry = ICasimirRegistryDev(manager.getRegistryAddress());
        uint64[] memory operatorIds = registry.getOperatorIds();
        uint256 count = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint64 operatorId = operatorIds[i];
            operators[count] = registry.getOperator(operatorId);
            count++;
        }
        return operators;
    }

    /// @inheritdoc ICasimirViewsDev
    function getPoolConfig(uint32 poolId) external view returns (PoolConfig memory poolConfig) {
        address poolAddress = manager.getPoolAddress(poolId);
        ICasimirPoolDev pool = ICasimirPoolDev(poolAddress);
        poolConfig = PoolConfig({
            poolAddress: poolAddress,
            balance: poolAddress.balance,
            operatorIds: pool.getOperatorIds(),
            publicKey: pool.publicKey(),
            reshares: pool.reshares(),
            status: pool.status()
        });
    }

    /// @inheritdoc ICasimirViewsDev
    function getSweptBalance(uint256 startIndex, uint256 endIndex) external view returns (uint128 sweptBalance) {
        uint32[] memory pendingPoolIds = manager.getPendingPoolIds();
        uint32[] memory stakedPoolIds = manager.getStakedPoolIds();
        for (uint256 i = startIndex; i <= endIndex; i++) {
            uint32 poolId;
            if (i < pendingPoolIds.length) {
                poolId = pendingPoolIds[i];
            } else {
                poolId = stakedPoolIds[i - pendingPoolIds.length];
            }
            sweptBalance += uint128(manager.getPoolAddress(poolId).balance / 1 gwei);
        }
    }
}
