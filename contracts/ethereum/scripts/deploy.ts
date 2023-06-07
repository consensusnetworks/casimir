import { ethers } from 'hardhat'

void async function () {
    const managerArgs = {
        oracleAddress: process.env.ORACLE_ADDRESS,
        beaconDepositAddress: process.env.BEACON_DEPOSIT_ADDRESS,
        linkFunctionsAddress: process.env.LINK_FUNCTIONS_ADDRESS,
        linkRegistrarAddress: process.env.LINK_REGISTRAR_ADDRESS,
        linkRegistryAddress: process.env.LINK_REGISTRY_ADDRESS,
        linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
        ssvNetworkAddress: process.env.SSV_NETWORK_ADDRESS,
        ssvNetworkViewsAddress: process.env.SSV_NETWORK_VIEWS_ADDRESS,
        ssvTokenAddress: process.env.SSV_TOKEN_ADDRESS,
        swapFactoryAddress: process.env.SWAP_FACTORY_ADDRESS,
        swapRouterAddress: process.env.SWAP_ROUTER_ADDRESS,
        wethTokenAddress: process.env.WETH_TOKEN_ADDRESS
    }
    const managerFactory = await ethers.getContractFactory('CasimirManager')
    const manager = await managerFactory.deploy(...Object.values(managerArgs))
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
    const views = await viewsFactory.deploy(...Object.values(viewsArgs))
    console.log(`CasimirViews contract deployed to ${views.address}`)
}()