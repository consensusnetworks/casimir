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
contract CasimirViews is ICasimirViews, Initializable {
    /// @dev Compound minimum (0.1 ETH)
    uint256 private constant COMPOUND_MINIMUM = 100000000 gwei;
    /// @dev Manager contract
    ICasimirManager private manager;
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
        manager = ICasimirManager(managerAddress);
    }

    /// @inheritdoc ICasimirViews
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

    /// @inheritdoc ICasimirViews
    function getPendingPoolCount() external view returns (uint256 pendingPoolCount) {
        pendingPoolCount = manager.getPendingPoolIds().length;
    }

    /// @inheritdoc ICasimirViews
    function getPendingPoolPublicKeys(uint256 startIndex, uint256 endIndex) external view returns (bytes[] memory) {
        bytes[] memory publicKeys = new bytes[](endIndex - startIndex);
        uint32[] memory pendingPoolIds = manager.getPendingPoolIds();
        uint256 count = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint32 poolId = pendingPoolIds[i];
            publicKeys[count] = ICasimirPool(manager.getPoolAddress(poolId)).publicKey();
            count++;
        }
        return publicKeys;
    }

    /// @inheritdoc ICasimirViews
    function getStakedPoolCount() external view returns (uint256 stakedPoolCount) {
        stakedPoolCount = manager.getStakedPoolIds().length;
    }

    /// @inheritdoc ICasimirViews
    function getStakedPoolPublicKeys(uint256 startIndex, uint256 endIndex) external view returns (bytes[] memory) {
        bytes[] memory publicKeys = new bytes[](endIndex - startIndex);
        uint32[] memory stakedPoolIds = manager.getStakedPoolIds();
        uint256 count = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint32 poolId = stakedPoolIds[i];
            publicKeys[count] = ICasimirPool(manager.getPoolAddress(poolId)).publicKey();
            count++;
        }
        return publicKeys;
    }

    /// @inheritdoc ICasimirViews
    function getStakedPoolStatuses(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (ICasimirPool.PoolStatus[] memory) {
        ICasimirPool.PoolStatus[] memory statuses = new ICasimirPool.PoolStatus[](endIndex - startIndex);
        uint32[] memory stakedPoolIds = manager.getStakedPoolIds();
        uint256 count = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint32 poolId = stakedPoolIds[i];
            statuses[count] = ICasimirPool(manager.getPoolAddress(poolId)).status();
            count++;
        }
        return statuses;
    }

    /// @inheritdoc ICasimirViews
    function getOperators(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (ICasimirRegistry.Operator[] memory) {
        ICasimirRegistry.Operator[] memory operators = new ICasimirRegistry.Operator[](endIndex - startIndex);
        ICasimirRegistry registry = ICasimirRegistry(manager.getRegistryAddress());
        uint64[] memory operatorIds = registry.getOperatorIds();
        uint256 count = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint64 operatorId = operatorIds[i];
            operators[count] = registry.getOperator(operatorId);
            count++;
        }
        return operators;
    }

    /// @inheritdoc ICasimirViews
    function getPoolConfig(uint32 poolId) external view returns (PoolConfig memory poolConfig) {
        address poolAddress = manager.getPoolAddress(poolId);
        ICasimirPool pool = ICasimirPool(poolAddress);
        poolConfig = PoolConfig({
            poolAddress: poolAddress,
            balance: poolAddress.balance,
            operatorIds: pool.getOperatorIds(),
            publicKey: pool.publicKey(),
            reshares: pool.reshares(),
            status: pool.status()
        });
    }

    /// @inheritdoc ICasimirViews
    function getSweptBalance(uint256 startIndex, uint256 endIndex) external view returns (uint128 sweptBalance) {
        uint32[] memory stakedPoolIds = manager.getStakedPoolIds();
        for (uint256 i = startIndex; i < endIndex; i++) {
            uint32 poolId = stakedPoolIds[i];
            sweptBalance += uint128(manager.getPoolAddress(poolId).balance / 1 gwei);
        }
    }
}
