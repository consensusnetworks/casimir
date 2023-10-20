// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "../CasimirManager.sol";
import "../CasimirPool.sol";
import "../CasimirRegistry.sol";
import "../CasimirUpkeep.sol";
import "../CasimirViews.sol";
import "../interfaces/ICasimirCore.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

/// @title Library to create beacon proxy contracts
library CasimirBeaconDev {
    /**
     * @notice Deploy a new manager beacon proxy contract
     * @param managerBeaconAddress Manager beacon address
     * @param daoOracleAddress DAO oracle address
     * @param functionsOracleAddress Chainlink functions oracle address
     * @param strategy Staking strategy configuration
     */
    function createManager(
        address managerBeaconAddress,
        address daoOracleAddress,
        address functionsOracleAddress,
        ICasimirCoreDev.Strategy memory strategy
    ) public returns (address managerAddress) {
        managerAddress = address(
            new BeaconProxy(
                managerBeaconAddress,
                abi.encodeWithSelector(
                    CasimirManagerDev(payable(address(0))).initialize.selector,
                    daoOracleAddress,
                    functionsOracleAddress,
                    strategy
                )
            )
        );
    }

    /**
     * @notice Deploy a new pool beacon proxy contract
     * @param poolBeaconAddress Pool beacon address
     * @param registryAddress Registry contract address
     * @param poolId Pool ID
     * @param operatorIds Operator IDs
     * @param publicKey Validator public key
     * @param shares Operator key shares
     * @return poolAddress Pool contract address
     */
    function createPool(
        address poolBeaconAddress,
        address registryAddress,
        uint64[] memory operatorIds,
        uint32 poolId,
        bytes memory publicKey,
        bytes memory shares
    ) public returns (address poolAddress) {
        poolAddress = address(
            new BeaconProxy(
                poolBeaconAddress,
                abi.encodeWithSelector(
                    CasimirPoolDev(address(0)).initialize.selector,
                    registryAddress,
                    operatorIds,
                    poolId,
                    publicKey,
                    shares
                )
            )
        );
    }

    /**
     * @notice Deploy a new registry beacon proxy
     * @param registryBeaconAddress Registry beacon address
     * @param minCollateral Minimum collateral per operator per pool
     * @param privateOperators Whether private operators are enabled
     * @param verifiedOperators Whether verified operators are enabled
     * @return registryAddress Registry address
     */
    function createRegistry(
        address registryBeaconAddress,
        uint256 minCollateral,
        bool privateOperators,
        bool verifiedOperators
    ) public returns (address registryAddress) {
        registryAddress = address(
            new BeaconProxy(
                registryBeaconAddress,
                abi.encodeWithSelector(
                    CasimirRegistryDev(address(0)).initialize.selector,
                    minCollateral,
                    privateOperators,
                    verifiedOperators
                )
            )
        );
    }

    /**
     * @notice Deploy a new upkeep beacon proxy contract
     * @param upkeepBeaconAddress Upkeep beacon address
     * @param factoryAddress Factory contract address
     * @param functionsOracleAddress Chainlink functions oracle address
     * @param compoundStake Whether to compound stake
     * @return upkeepAddress Upkeep contract address
     */
    function createUpkeep(
        address upkeepBeaconAddress,
        address factoryAddress,
        address functionsOracleAddress,
        bool compoundStake
    ) public returns (address upkeepAddress) {
        upkeepAddress = address(
            new BeaconProxy(
                upkeepBeaconAddress,
                abi.encodeWithSelector(
                    CasimirUpkeepDev(address(0)).initialize.selector,
                    factoryAddress,
                    functionsOracleAddress,
                    compoundStake
                )
            )
        );
    }

    /**
     * @notice Deploy a new views beacon proxy contract
     * @param viewsBeaconAddress Views beacon address
     * @param managerAddress Manager contract address
     * @return viewsAddress Views contract address
     */
    function createViews(address viewsBeaconAddress, address managerAddress) public returns (address viewsAddress) {
        viewsAddress = address(
            new BeaconProxy(
                viewsBeaconAddress,
                abi.encodeWithSelector(CasimirViewsDev(address(0)).initialize.selector, managerAddress)
            )
        );
    }
}
