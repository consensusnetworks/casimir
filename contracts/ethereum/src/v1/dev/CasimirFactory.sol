// SPDX-License-Identifier: Apache
pragma solidity 0.8.18;

import "./CasimirCore.sol";
import "./interfaces/ICasimirFactory.sol";
import "./interfaces/ICasimirManager.sol";
import "./interfaces/ICasimirRegistry.sol";
import "./interfaces/ICasimirUpkeep.sol";
import "./libraries/CasimirBeacon.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/// @title Factory that deploys and configures managers
contract CasimirFactoryDev is ICasimirFactoryDev, CasimirCoreDev, Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    /**
     * @inheritdoc ICasimirFactoryDev
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    address public immutable managerBeaconAddress;
    /**
     * @inheritdoc ICasimirFactoryDev
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    address public immutable poolBeaconAddress;
    /**
     * @inheritdoc ICasimirFactoryDev
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    address public immutable registryBeaconAddress;
    /**
     * @inheritdoc ICasimirFactoryDev
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    address public immutable upkeepBeaconAddress;
    /**
     * @inheritdoc ICasimirFactoryDev
     * @custom:oz-upgrades-unsafe-allow state-variable-immutable
     */
    address public immutable viewsBeaconAddress;
    /// @dev Deployed manager addresses
    mapping(uint32 => address) private managerAddresses;
    /// @dev Deployed views addresses
    mapping(uint32 => address) private viewsAddresses;
    /// @dev Last manager ID
    uint32 private lastManagerId;
    /// @dev Storage gap
    uint256[50] private __gap;

    /**
     * @dev Constructor
     * @param managerBeaconAddress_ Manager beacon address
     * @param poolBeaconAddress_ Pool beacon address
     * @param registryBeaconAddress_ Registry beacon address
     * @param upkeepBeaconAddress_ Upkeep beacon address
     * @param viewsBeaconAddress_ Views beacon address
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor(
        address managerBeaconAddress_,
        address poolBeaconAddress_,
        address registryBeaconAddress_,
        address upkeepBeaconAddress_,
        address viewsBeaconAddress_
    ) {
        onlyAddress(managerBeaconAddress_);
        onlyAddress(poolBeaconAddress_);
        onlyAddress(registryBeaconAddress_);
        onlyAddress(upkeepBeaconAddress_);
        onlyAddress(viewsBeaconAddress_);
        managerBeaconAddress = managerBeaconAddress_;
        poolBeaconAddress = poolBeaconAddress_;
        registryBeaconAddress = registryBeaconAddress_;
        upkeepBeaconAddress = upkeepBeaconAddress_;
        viewsBeaconAddress = viewsBeaconAddress_;
        _disableInitializers();
    }

    /**
     * @notice Initialize the contract
     */
    function initialize() public initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
    }

    /// @inheritdoc ICasimirFactoryDev
    function deployManager(
        address daoOracleAddress,
        address functionsOracleAddress,
        Strategy memory strategy
    ) external onlyOwner {
        onlyAddress(daoOracleAddress);
        onlyAddress(functionsOracleAddress);
        managerAddresses[++lastManagerId] = CasimirBeaconDev.createManager(
            managerBeaconAddress,
            daoOracleAddress,
            functionsOracleAddress,
            strategy
        );
        ICasimirManagerDev manager = ICasimirManagerDev(managerAddresses[lastManagerId]);
        viewsAddresses[lastManagerId] = CasimirBeaconDev.createViews(viewsBeaconAddress, address(manager));
        emit ManagerDeployed(lastManagerId);
    }

    /// @inheritdoc ICasimirFactoryDev
    function getManagerConfig(uint32 managerId) external view returns (ManagerConfig memory) {
        ICasimirManagerDev manager = ICasimirManagerDev(managerAddresses[managerId]);
        ICasimirRegistryDev registry = ICasimirRegistryDev(manager.getRegistryAddress());
        ICasimirUpkeepDev upkeep = ICasimirUpkeepDev(manager.getUpkeepAddress());
        return
            ManagerConfig({
                managerAddress: managerAddresses[managerId],
                registryAddress: address(registry),
                upkeepAddress: address(upkeep),
                viewsAddress: viewsAddresses[managerId],
                strategy: Strategy({
                    minCollateral: registry.minCollateral(),
                    lockPeriod: manager.lockPeriod(),
                    userFee: manager.userFee(),
                    compoundStake: upkeep.compoundStake(),
                    eigenStake: manager.eigenStake(),
                    liquidStake: manager.liquidStake(),
                    privateOperators: registry.privateOperators(),
                    verifiedOperators: registry.verifiedOperators()
                })
            });
    }

    /// @inheritdoc ICasimirFactoryDev
    function getManagerIds() external view returns (uint32[] memory) {
        uint32[] memory managerIds = new uint32[](lastManagerId);
        for (uint32 i; i < lastManagerId; i++) {
            managerIds[i] = i + 1;
        }
        return managerIds;
    }

    /// @inheritdoc ICasimirFactoryDev
    function getOwner() external view returns (address) {
        return owner();
    }
}
