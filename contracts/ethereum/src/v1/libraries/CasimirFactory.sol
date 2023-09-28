// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "../CasimirPool.sol";
import "../CasimirRegistry.sol";
import "../CasimirUpkeep.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

library CasimirFactory {
    /**
     * @notice Create a new pool beacon proxy contract
     * @param poolBeaconAddress The address of the pool beacon
     * @param registryAddress The address of the registry contract
     * @param poolId The pool ID
     * @param publicKey The validator public key
     * @param operatorIds The operator IDs
     * @return poolAddress The pool contract address
     */
    function createPool(
        address poolBeaconAddress,
        address registryAddress,
        uint32 poolId,
        bytes memory publicKey,
        uint64[] memory operatorIds
    ) public returns (address poolAddress) {
        poolAddress = address(
            new BeaconProxy(
                poolBeaconAddress,
                abi.encodeWithSelector(
                    CasimirPool(address(0)).initialize.selector,
                    registryAddress,
                    poolId,
                    publicKey,
                    operatorIds
                )
            )
        );
    }

    /**
     * @notice Create a new registry beacon proxy contract
     * @param registryBeaconAddress The address of the registry beacon
     * @param ssvViewsAddress The address of the SSV views contract
     * @return registryAddress The registry contract address
     */
    function createRegistry(
        address registryBeaconAddress,
        address ssvViewsAddress
    ) public returns (address registryAddress) {
        registryAddress = address(
            new BeaconProxy(
                registryBeaconAddress,
                abi.encodeWithSelector(
                    CasimirRegistry(address(0)).initialize.selector,
                    ssvViewsAddress
                )
            )
        );
    }

    /**
     * @notice Create a new upkeep beacon proxy contract
     * @param upkeepBeaconAddress The address of the upkeep beacon
     * @param functionsOracleAddress The address of the functions oracle
     * @return upkeepAddress The upkeep contract address
     */
    function createUpkeep(
        address upkeepBeaconAddress,
        address functionsOracleAddress
    ) public returns (address upkeepAddress) {
        upkeepAddress = address(
            new BeaconProxy(
                upkeepBeaconAddress,
                abi.encodeWithSelector(
                    CasimirUpkeep(address(0)).initialize.selector,
                    functionsOracleAddress
                )
            )
        );
    }
}
