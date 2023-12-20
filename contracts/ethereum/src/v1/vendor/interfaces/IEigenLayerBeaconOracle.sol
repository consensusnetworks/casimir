// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

/// @title EigenLayer beacon oracle interface
interface IEigenLayerBeaconOracle {
    /**
     * @notice A beacon block root oracle update event
     * @param slot Beacon slot
     * @param timestamp Oracle update timestamp
     * @param blockRoot Beacon block root
     */
    event EigenLayerBeaconOracleUpdate(uint256 slot, uint256 timestamp, bytes32 blockRoot);
    
    /**
     * @notice Get the beacon block root for a given oracle update timestamp
     * @param timestamp Oracle update timestamp
     */
    function getBeaconBlockRoot(uint256 timestamp) external view returns (bytes32);
}