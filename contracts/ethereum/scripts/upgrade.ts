import { ethers, upgrades } from 'hardhat'

/**
 * Upgrade ethereum contracts
 */
void async function () {
    if (!process.env.POOL_BEACON_ADDRESS) throw new Error('No pool beacon address provided')
    if (!process.env.REGISTRY_BEACON_ADDRESS) throw new Error('No registry beacon address provided')
    if (!process.env.UPKEEP_BEACON_ADDRESS) throw new Error('No upkeep beacon address provided')
    if (!process.env.MANAGER_ADDRESS) throw new Error('No manager address provided')
    if (!process.env.VIEWS_ADDRESS) throw new Error('No views address provided')
    
    const arrayFactory = await ethers.getContractFactory('CasimirArray')
    const arrayLibrary = await arrayFactory.deploy()
    console.log(`CasimirArray library upgraded at ${arrayLibrary.address}`)

    const factoryFactory = await ethers.getContractFactory('CasimirFactory')
    const factoryLibrary = await factoryFactory.deploy()
    console.log(`CasimirFactory library upgraded at ${factoryLibrary.address}`)

    const poolFactory = await ethers.getContractFactory('CasimirPool')
    const poolBeacon = await upgrades.upgradeBeacon(process.env.POOL_BEACON_ADDRESS, poolFactory, { unsafeAllow: ['constructor'] })
    await poolBeacon.deployed()
    console.log(`CasimirPool beacon upgraded at ${poolBeacon.address}`)

    const registryFactory = await ethers.getContractFactory('CasimirRegistry')
    const registryBeacon = await upgrades.upgradeBeacon(process.env.REGISTRY_BEACON_ADDRESS, registryFactory, { unsafeAllow: ['constructor'] })
    await registryBeacon.deployed()
    console.log(`CasimirRegistry beacon upgraded at ${registryBeacon.address}`)

    const upkeepFactory = await ethers.getContractFactory('CasimirUpkeep')
    const upkeepBeacon = await upgrades.upgradeBeacon(process.env.UPKEEP_BEACON_ADDRESS, upkeepFactory, { unsafeAllow: ['constructor'] })
    await upkeepBeacon.deployed()
    console.log(`CasimirUpkeep beacon upgraded at ${upkeepBeacon.address}`)

    const managerFactory = await ethers.getContractFactory('CasimirManager', {
        libraries: {
            CasimirArray: arrayLibrary.address,
            CasimirFactory: factoryLibrary.address
        }
    })
    const manager = await upgrades.upgradeProxy(process.env.MANAGER_ADDRESS, managerFactory, { unsafeAllow: ['constructor', 'external-library-linking'] })
    await manager.deployed()
    console.log(`CasimirManager contract upgraded at ${manager.address}`)

    const viewsFactory = await ethers.getContractFactory('CasimirViews')
    const views = await upgrades.upgradeProxy(process.env.VIEWS_ADDRESS, viewsFactory, { unsafeAllow: ['constructor'] })
    console.log(`CasimirViews contract upgraded at ${views.address}`)
}()