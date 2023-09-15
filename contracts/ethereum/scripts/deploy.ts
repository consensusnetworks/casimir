import { ethers, upgrades } from 'hardhat'
import requestConfig from '@casimir/functions/Functions-request-config'

upgrades.silenceWarnings()

/**
 * Deploy ethereum contracts
*/
void async function () {
    const [, daoOracle, donTransmitter] = await ethers.getSigners()

    const functionsOracleFactoryFactory = await ethers.getContractFactory('FunctionsOracleFactory')
    const functionsOracleFactory = await functionsOracleFactoryFactory.deploy()
    await functionsOracleFactory.deployed()
    console.log(`FunctionsOracleFactory contract deployed to ${functionsOracleFactory.address}`)

    const deployNewOracle = await functionsOracleFactory.deployNewOracle()
    const deployNewOracleReceipt = await deployNewOracle.wait()
    if (!deployNewOracleReceipt.events) throw new Error('Functions oracle deployment failed')
    const functionsOracleAddress = deployNewOracleReceipt.events[1].args?.don as string
    const functionsOracle = await ethers.getContractAt('FunctionsOracle', functionsOracleAddress)
    const acceptOwnership = await functionsOracle.acceptOwnership()
    await acceptOwnership.wait()
    console.log(`FunctionsOracle contract deployed to ${functionsOracle.address}`)

    const functionsBillingRegistryArgs = {
        linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
        linkEthFeedAddress: process.env.LINK_ETH_FEED_ADDRESS,
        functionsOracleAddress: functionsOracle.address
    }
    const functionsBillingRegistryFactory = await ethers.getContractFactory('FunctionsBillingRegistry')
    const functionsBillingRegistry = await functionsBillingRegistryFactory.deploy(...Object.values(functionsBillingRegistryArgs))
    await functionsBillingRegistry.deployed()
    console.log(`FunctionsBillingRegistry contract deployed to ${functionsBillingRegistry.address}`)

    const functionsBillingRegistryConfig = {
        maxGasLimit: 400_000,
        stalenessSeconds: 86_400,
        gasAfterPaymentCalculation:
            21_000 + 5_000 + 2_100 + 20_000 + 2 * 2_100 - 15_000 + 7_315,
        weiPerUnitLink: ethers.BigNumber.from('5000000000000000'),
        gasOverhead: 100_000,
        requestTimeoutSeconds: 300,
    }

    await functionsBillingRegistry.setConfig(
        functionsBillingRegistryConfig.maxGasLimit,
        functionsBillingRegistryConfig.stalenessSeconds,
        functionsBillingRegistryConfig.gasAfterPaymentCalculation,
        functionsBillingRegistryConfig.weiPerUnitLink,
        functionsBillingRegistryConfig.gasOverhead,
        functionsBillingRegistryConfig.requestTimeoutSeconds
    )

    const arrayFactory = await ethers.getContractFactory('CasimirArray')
    const arrayLibrary = await arrayFactory.deploy()

    const factoryFactory = await ethers.getContractFactory('CasimirFactory')
    const factoryLibrary = await factoryFactory.deploy()

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
        beaconDepositAddress: process.env.BEACON_DEPOSIT_ADDRESS,
        daoOracleAddress: daoOracle.address,
        functionsBillingRegistryAddress: functionsBillingRegistry.address,
        functionsOracleAddress: functionsOracle.address,
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
    const managerFactory = await ethers.getContractFactory('CasimirManager', {
        libraries: {
            CasimirArray: arrayLibrary.address,
            CasimirFactory: factoryLibrary.address
        }
    })
    const manager = await upgrades.deployProxy(managerFactory, Object.values(managerArgs), { unsafeAllow: ['constructor', 'external-library-linking'] })
    await manager.deployed()
    console.log(`CasimirManager contract deployed to ${manager.address}`)

    const registry = await ethers.getContractAt('CasimirRegistry', await manager.getRegistryAddress())
    console.log(`CasimirRegistry contract deployed to ${registry.address}`)

    const upkeep = await ethers.getContractAt('CasimirUpkeep', await manager.getUpkeepAddress())
    console.log(`CasimirUpkeep contract deployed to ${upkeep.address}`)

    const viewsArgs = {
        managerAddress: manager.address,
        registryAddress: registry.address
    }
    const viewsFactory = await ethers.getContractFactory('CasimirViews')
    const views = await upgrades.deployProxy(viewsFactory, Object.values(viewsArgs), { unsafeAllow: ['constructor'] })
    console.log(`CasimirViews contract deployed to ${views.address}`)

    const setRequest = await manager.setFunctionsRequest(requestConfig.source, requestConfig.args, 300000)
    await setRequest.wait()

    await functionsBillingRegistry.setAuthorizedSenders([donTransmitter.address, functionsOracle.address])
    await functionsOracle.setRegistry(functionsBillingRegistry.address)
    await functionsOracle.addAuthorizedSenders([donTransmitter.address, manager.address])
}()