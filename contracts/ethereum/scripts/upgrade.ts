import { ethers, upgrades } from 'hardhat'

/**
 * Upgrade ethereum contracts
 */
void async function () {
    const arrayFactory = await ethers.getContractFactory('CasimirArray')
    const arrayLibrary = await arrayFactory.deploy()
    console.log(`CasimirArray library upgraded at ${arrayLibrary.address}`)

    const factoryFactory = await ethers.getContractFactory('CasimirFactory')
    const factoryLibrary = await factoryFactory.deploy()
    console.log(`CasimirFactory library upgraded at ${factoryLibrary.address}`)

    const poolFactory = await ethers.getContractFactory('CasimirPool')
    const poolBeaconAddress = process.env.POOL_BEACON_ADDRESS || '0x40ab9061247008C6507F685E1dAB8C3953bb8e4a'
    const poolBeacon = await upgrades.upgradeBeacon(poolBeaconAddress, poolFactory, { unsafeAllow: ['constructor'] })
    await poolBeacon.deployed()
    console.log(`CasimirPool beacon upgraded at ${poolBeacon.address}`)

    const registryFactory = await ethers.getContractFactory('CasimirRegistry')
    const registryBeaconAddress = process.env.REGISTRY_BEACON_ADDRESS || '0x92D722b2A91Bf03e9b5058E8341D09c30828aff6'
    const registryBeacon = await upgrades.upgradeBeacon(registryBeaconAddress, registryFactory, { unsafeAllow: ['constructor'] })
    await registryBeacon.deployed()
    console.log(`CasimirRegistry beacon upgraded at ${registryBeacon.address}`)

    const upkeepFactory = await ethers.getContractFactory('CasimirUpkeep')
    const upkeepBeaconAddress = process.env.UPKEEP_BEACON_ADDRESS || '0x95b0127949F5F43b1bc681175dAdA2782580cf9e'
    const upkeepBeacon = await upgrades.upgradeBeacon(upkeepBeaconAddress, upkeepFactory, { unsafeAllow: ['constructor'] })
    await upkeepBeacon.deployed()
    console.log(`CasimirUpkeep beacon upgraded at ${upkeepBeacon.address}`)

    const managerFactory = await ethers.getContractFactory('CasimirManager', {
        libraries: {
            CasimirArray: arrayLibrary.address,
            CasimirFactory: factoryLibrary.address
        }
    })
    const managerAddress = process.env.MANAGER_ADDRESS || '0xf4F11A5bD713C2c0e0eCCBC64559d73373d2749C'
    const manager = await upgrades.upgradeProxy(managerAddress, managerFactory, { unsafeAllow: ['constructor', 'external-library-linking'] })
    await manager.deployed()
    console.log(`CasimirManager contract upgraded at ${manager.address}`)

    const viewsFactory = await ethers.getContractFactory('CasimirViews')
    const viewsAddress = process.env.VIEWS_ADDRESS || '0x552804Cf1fbFfa1E539bEBeF7117d5E8a1E4F32D'
    const views = await upgrades.upgradeProxy(viewsAddress, viewsFactory, { unsafeAllow: ['constructor'] })
    console.log(`CasimirViews contract upgraded at ${views.address}`)
}()