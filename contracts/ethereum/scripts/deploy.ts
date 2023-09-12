import { ethers, upgrades } from 'hardhat'

upgrades.silenceWarnings()

/**
 * Deploy ethereum contracts
*/
void async function () {
    const poolFactory = await ethers.getContractFactory('CasimirPool')
    const poolBeacon = await upgrades.deployBeacon(poolFactory, { unsafeAllow: ['constructor'] })
    await poolBeacon.deployed()
    console.log(`CasimirPool beacon deployed to ${poolBeacon.address}`)

    const registryFactory = await ethers.getContractFactory('CasimirRegistry')
    const registryBeacon = await upgrades.deployBeacon(registryFactory, { unsafeAllow: ['constructor'] })
    await registryBeacon.deployed()
    console.log(`CasimirRegistry beacon deployed to ${registryBeacon.address}`)

    const upkeepFactory = await ethers.getContractFactory('CasimirUpkeep')
    const upkeepBeacon = await upgrades.deployBeacon(upkeepFactory, { unsafeAllow: ['constructor'] })
    await upkeepBeacon.deployed()
    console.log(`CasimirUpkeep beacon deployed to ${upkeepBeacon.address}`)

    const managerArgs = {
        daoOracleAddress: process.env.DAO_ORACLE_ADDRESS,
        beaconDepositAddress: process.env.BEACON_DEPOSIT_ADDRESS,
        functionsBillingRegistryAddress: process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS,
        functionsOracleAddress: process.env.FUNCTIONS_ORACLE_ADDRESS,
        keeperRegistrarAddress: process.env.KEEPER_REGISTRAR_ADDRESS,
        keeperRegistryAddress: process.env.KEEPER_REGISTRY_ADDRESS,
        linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
        poolBeaconAddress: poolBeacon.address,
        registryBeaconAddress: registryBeacon.address,
        ssvNetworkAddress: process.env.SSV_NETWORK_ADDRESS,
        ssvViewsAddress: process.env.SSV_VIEWS_ADDRESS,
        ssvTokenAddress: process.env.SSV_TOKEN_ADDRESS,
        swapFactoryAddress: process.env.SWAP_FACTORY_ADDRESS,
        swapRouterAddress: process.env.SWAP_ROUTER_ADDRESS,
        upkeepBeaconAddress: upkeepBeacon.address,
        wethTokenAddress: process.env.WETH_TOKEN_ADDRESS
    }
    const managerFactory = await ethers.getContractFactory('CasimirManager')
    const manager = await upgrades.deployProxy(managerFactory, Object.values(managerArgs))
    await manager.deployed()
    console.log(`CasimirManager contract deployed to ${manager.address}`)

    const registryAddress = await manager.getRegistryAddress()
    console.log(`CasimirRegistry contract deployed to ${registryAddress}`)

    const upkeepAddress = await manager.getUpkeepAddress()
    console.log(`CasimirUpkeep contract deployed to ${upkeepAddress}`)

    const viewsArgs = {
        managerAddress: manager.address,
        registryAddress
    }
    const viewsFactory = await ethers.getContractFactory('CasimirViews')
    const views = await upgrades.deployProxy(viewsFactory, Object.values(viewsArgs))
    console.log(`CasimirViews contract deployed to ${views.address}`)
}()