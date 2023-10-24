import { ethers, upgrades } from 'hardhat'

/**
 * Upgrade ethereum contracts
 */
void async function () {
    if (!process.env.MANAGER_BEACON_ADDRESS) throw new Error('No manager beacon address provided')
    if (!process.env.POOL_BEACON_ADDRESS) throw new Error('No pool beacon address provided')
    if (!process.env.REGISTRY_BEACON_ADDRESS) throw new Error('No registry beacon address provided')
    if (!process.env.UPKEEP_BEACON_ADDRESS) throw new Error('No upkeep beacon address provided')
    if (!process.env.VIEWS_ADDRESS) throw new Error('No views address provided')
    if (!process.env.FACTORY_ADDRESS) throw new Error('No factory address provided')
    if (!process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS) throw new Error('No functions billing registry address provided')
    if (!process.env.KEEPER_REGISTRAR_ADDRESS) throw new Error('No keeper registrar address provided')
    if (!process.env.KEEPER_REGISTRY_ADDRESS) throw new Error('No keeper registry address provided')
    if (!process.env.LINK_TOKEN_ADDRESS) throw new Error('No link token address provided')
    if (!process.env.SSV_NETWORK_ADDRESS) throw new Error('No ssv network address provided')
    if (!process.env.SSV_TOKEN_ADDRESS) throw new Error('No ssv token address provided')
    if (!process.env.SSV_VIEWS_ADDRESS) throw new Error('No ssv views address provided')
    if (!process.env.SWAP_FACTORY_ADDRESS) throw new Error('No swap factory address provided')
    if (!process.env.SWAP_ROUTER_ADDRESS) throw new Error('No swap router address provided')
    if (!process.env.WETH_TOKEN_ADDRESS) throw new Error('No weth token address provided')

    let beaconLibraryAddress = process.env.BEACON_LIBRARY_ADDRESS
    if (!beaconLibraryAddress) {
        const beaconLibraryFactory = await ethers.getContractFactory('CasimirBeacon')
        const beaconLibrary = await beaconLibraryFactory.deploy()
        console.log(`CasimirBeacon library deployed at ${beaconLibrary.address}`)
        beaconLibraryAddress = beaconLibrary.address
    }

    const managerBeaconFactory = await ethers.getContractFactory('CasimirManager', {
        libraries: {
            CasimirBeacon: beaconLibraryAddress
        }
    })
    const managerBeacon = await upgrades.upgradeBeacon(process.env.MANAGER_BEACON_ADDRESS, managerBeaconFactory, { 
        constructorArgs: [
            process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS as string,
            process.env.KEEPER_REGISTRAR_ADDRESS as string,
            process.env.KEEPER_REGISTRY_ADDRESS as string,
            process.env.LINK_TOKEN_ADDRESS as string,
            process.env.SSV_NETWORK_ADDRESS as string,
            process.env.SSV_TOKEN_ADDRESS as string,
            process.env.SWAP_FACTORY_ADDRESS as string,
            process.env.SWAP_ROUTER_ADDRESS as string,
            process.env.WETH_TOKEN_ADDRESS as string
        ]
    })
    await managerBeacon.deployed()
    console.log(`CasimirManager beacon upgraded at ${managerBeacon.address}`)

    const poolBeaconFactory = await ethers.getContractFactory('CasimirPool')
    const poolBeacon = await upgrades.upgradeBeacon(process.env.POOL_BEACON_ADDRESS, poolBeaconFactory, {
        constructorArgs: [
            process.env.DEPOSIT_CONTRACT_ADDRESS as string
        ]
    })
    await poolBeacon.deployed()
    console.log(`CasimirPool beacon upgraded at ${poolBeacon.address}`)

    const registryBeaconFactory = await ethers.getContractFactory('CasimirRegistry')
    const registryBeacon = await upgrades.upgradeBeacon(process.env.REGISTRY_BEACON_ADDRESS, registryBeaconFactory, { 
        constructorArgs: [
            process.env.SSV_VIEWS_ADDRESS as string
        ]
    })
    await registryBeacon.deployed()
    console.log(`CasimirRegistry beacon upgraded at ${registryBeacon.address}`)

    const upkeepBeaconFactory = await ethers.getContractFactory('CasimirUpkeep')
    const upkeepBeacon = await upgrades.upgradeBeacon(process.env.UPKEEP_BEACON_ADDRESS, upkeepBeaconFactory)
    await upkeepBeacon.deployed()
    console.log(`CasimirUpkeep beacon upgraded at ${upkeepBeacon.address}`)
    
    const viewsBeaconFactory = await ethers.getContractFactory('CasimirViews')
    const viewsBeacon = await upgrades.upgradeBeacon(process.env.VIEWS_ADDRESS, viewsBeaconFactory)
    await viewsBeacon.deployed()
    console.log(`CasimirViews beacon upgraded at ${viewsBeacon.address}`)

    const factoryFactory = await ethers.getContractFactory('CasimirFactory', {
        libraries: {
            CasimirBeacon: beaconLibraryAddress
        }
    })
    const factory = await upgrades.upgradeProxy(process.env.FACTORY_ADDRESS, factoryFactory, {
        constructorArgs: [
            managerBeacon.address,
            poolBeacon.address,
            registryBeacon.address,
            upkeepBeacon.address,
            viewsBeacon.address
        ],
        unsafeAllow: ['external-library-linking'] 
    })
    await factory.deployed()
    console.log(`CasimirFactory contract upgraded at ${factory.address}`)
}()