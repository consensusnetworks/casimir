import { ethers, upgrades } from 'hardhat'
import requestConfig from '@casimir/functions/Functions-request-config'
import { CasimirFactory, CasimirUpkeep } from '../build/@types'

upgrades.silenceWarnings()

/**
 * Deploy ethereum contracts
*/
void async function () {
    if (!process.env.DEPOSIT_CONTRACT_ADDRESS) throw new Error('No deposit contract address provided')
    if (!process.env.KEEPER_REGISTRAR_ADDRESS) throw new Error('No keeper registrar address provided')
    if (!process.env.KEEPER_REGISTRY_ADDRESS) throw new Error('No keeper registry address provided')
    if (!process.env.LINK_TOKEN_ADDRESS) throw new Error('No link token address provided')
    if (!process.env.LINK_ETH_FEED_ADDRESS) throw new Error('No link eth feed address provided')
    if (!process.env.SSV_NETWORK_ADDRESS) throw new Error('No ssv network address provided')
    if (!process.env.SSV_TOKEN_ADDRESS) throw new Error('No ssv token address provided')
    if (!process.env.SWAP_FACTORY_ADDRESS) throw new Error('No swap factory address provided')
    if (!process.env.SWAP_ROUTER_ADDRESS) throw new Error('No swap router address provided')
    if (!process.env.WETH_TOKEN_ADDRESS) throw new Error('No weth token address provided')

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

    const beaconLibraryFactory = await ethers.getContractFactory('CasimirBeacon')
    const beaconLibrary = await beaconLibraryFactory.deploy()
    console.log(`CasimirBeacon library deployed at ${beaconLibrary.address}`)

    const managerBeaconFactory = await ethers.getContractFactory('CasimirManager', {
        libraries: {
            CasimirBeacon: beaconLibrary.address
        }
    })
    const managerBeacon = await upgrades.deployBeacon(managerBeaconFactory, { 
        constructorArgs: [
            functionsBillingRegistry.address,
            process.env.KEEPER_REGISTRAR_ADDRESS as string,
            process.env.KEEPER_REGISTRY_ADDRESS as string,
            process.env.LINK_TOKEN_ADDRESS as string,
            process.env.SSV_NETWORK_ADDRESS as string,
            process.env.SSV_TOKEN_ADDRESS as string,
            process.env.SWAP_FACTORY_ADDRESS as string,
            process.env.SWAP_ROUTER_ADDRESS as string,
            process.env.WETH_TOKEN_ADDRESS as string
        ],
        unsafeAllow: ['external-library-linking'] 
    })
    await managerBeacon.deployed()
    console.log(`CasimirManager beacon deployed at ${managerBeacon.address}`)

    const poolBeaconFactory = await ethers.getContractFactory('CasimirPool')
    const poolBeacon = await upgrades.deployBeacon(poolBeaconFactory, { 
        constructorArgs: [
            process.env.DEPOSIT_CONTRACT_ADDRESS as string
        ] 
    })
    await poolBeacon.deployed()
    console.log(`CasimirPool beacon deployed at ${poolBeacon.address}`)

    const registryBeaconFactory = await ethers.getContractFactory('CasimirRegistry')
    const registryBeacon = await upgrades.deployBeacon(registryBeaconFactory, { 
        constructorArgs: [
            process.env.SSV_VIEWS_ADDRESS as string
        ]
    })
    await registryBeacon.deployed()
    console.log(`CasimirRegistry beacon deployed at ${registryBeacon.address}`)

    const upkeepBeaconFactory = await ethers.getContractFactory('CasimirUpkeep')
    const upkeepBeacon = await upgrades.deployBeacon(upkeepBeaconFactory)
    await upkeepBeacon.deployed()
    console.log(`CasimirUpkeep beacon deployed at ${upkeepBeacon.address}`)

    const viewsBeaconFactory = await ethers.getContractFactory('CasimirViews')
    const viewsBeacon = await upgrades.deployBeacon(viewsBeaconFactory)
    await viewsBeacon.deployed()
    console.log(`CasimirViews beacon deployed at ${viewsBeacon.address}`)

    const factoryFactory = await ethers.getContractFactory('CasimirFactory', {
        libraries: {
            CasimirBeacon: beaconLibrary.address
        }
    })
    const factory = await upgrades.deployProxy(factoryFactory, undefined, {
        constructorArgs: [
            managerBeacon.address,
            poolBeacon.address,
            registryBeacon.address,
            upkeepBeacon.address,
            viewsBeacon.address
        ],
        unsafeAllow: ['external-library-linking'] 
    }) as CasimirFactory
    await factory.deployed()
    console.log(`CasimirFactory contract deployed at ${factory.address}`)

    const defaultStrategy = {
        minCollateral: ethers.utils.parseEther('1.0'),
        lockPeriod: 0,
        userFee: 5,
        compoundStake: true,
        eigenStake: false,
        liquidStake: false,
        privateOperators: false,
        verifiedOperators: false
    }
    const deployBaseManager = await factory.deployManager(
        daoOracle.address,
        functionsOracle.address,
        defaultStrategy
    )
    await deployBaseManager.wait()
    const [managerId] = await factory.getManagerIds()
    const [managerAddress, registryAddress, upkeepAddress, viewsAddress] = await factory.getManagerConfig(managerId)
    console.log(`Default CasimirManager contract deployed to ${managerAddress}`)
    console.log(`Default CasimirRegistry contract deployed to ${registryAddress}`)
    console.log(`Default CasimirUpkeep contract deployed to ${upkeepAddress}`)
    console.log(`Default CasimirViews contract deployed to ${viewsAddress}`)
    const upkeep = await ethers.getContractAt('CasimirUpkeep', upkeepAddress) as CasimirUpkeep
    
    requestConfig.args[1] = viewsAddress
    const fulfillGasLimit = 300000
    const setRequest = await upkeep.setFunctionsRequest(requestConfig.source, requestConfig.args, fulfillGasLimit)
    await setRequest.wait()

    await functionsBillingRegistry.setAuthorizedSenders([donTransmitter.address, functionsOracle.address])
    await functionsOracle.setRegistry(functionsBillingRegistry.address)
    await functionsOracle.addAuthorizedSenders([donTransmitter.address, managerAddress])
}()