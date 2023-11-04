// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "../../interfaces/ICasimirCore.sol";

/// @title Factory interface
interface ICasimirFactoryDev is ICasimirCore {
    event FunctionsRequestSet(
        uint32 indexed managerId,
        string newRequestSource,
        string[] newRequestArgs,
        uint32 newFulfillGasLimit
    );
    event FunctionsOracleSet(uint32 indexed managerId, address newFunctionsOracleAddress);
    event ManagerDeployed(uint32 managerId);
    event ReservedFeesWithdrawn(uint32 indexed managerId, uint256 amount);

    /**
     * @notice Deploy a new manager
     * @param daoOracleAddress DAO oracle address
     * @param functionsOracleAddress Chainlink functions oracle address
     * @param strategy Staking strategy configuration
     */
    function deployManager(address daoOracleAddress, address functionsOracleAddress, Strategy memory strategy) external;

    /// @notice Manager beacon address
    function managerBeaconAddress() external view returns (address);

    /// @notice Pool beacon address
    function poolBeaconAddress() external view returns (address);

    /// @notice Registry beacon address
    function registryBeaconAddress() external view returns (address);

    /// @notice Upkeep beacon address
    function upkeepBeaconAddress() external view returns (address);

    /// @notice Views beacon address
    function viewsBeaconAddress() external view returns (address);

    /// @notice Get manager config
    function getManagerConfig(uint32 managerId) external view returns (ManagerConfig memory);

    /// @notice Get the manager IDs
    function getManagerIds() external view returns (uint32[] memory);

    /// @notice Get the owner address
    function getOwner() external view returns (address);
}
