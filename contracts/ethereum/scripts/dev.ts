import { CasimirManager, CasimirRegistry, ISSVViews, CasimirViews, CasimirUpkeep, FunctionsOracleFactory, FunctionsBillingRegistry, CasimirFactory } from '../build/@types'
import { ethers, network, upgrades } from 'hardhat'
import { fulfillReport, runUpkeep } from '@casimir/ethereum/helpers/upkeep'
import { round } from '@casimir/ethereum/helpers/math'
import { time, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import ISSVViewsAbi from '../build/abi/ISSVViews.json'
import { run } from '@casimir/shell'
import { PoolStatus } from '@casimir/types'
import requestConfig from '@casimir/functions/Functions-request-config'

upgrades.silenceWarnings()

/**
 * Deploy contracts to local network and run local events and oracle handling
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

    const [, daoOracle, donTransmitter, firstUser] = await ethers.getSigners()

    const functionsOracleFactoryFactory = await ethers.getContractFactory('FunctionsOracleFactory')
    const functionsOracleFactory = await functionsOracleFactoryFactory.deploy() as FunctionsOracleFactory
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
    const functionsBillingRegistry = await functionsBillingRegistryFactory.deploy(...Object.values(functionsBillingRegistryArgs)) as FunctionsBillingRegistry
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
    console.log(`CasimirBeacon library deployed to ${beaconLibrary.address}`)

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
    const deployDefaultManager = await factory.deployManager(
        daoOracle.address,
        functionsOracle.address,
        defaultStrategy
    )
    await deployDefaultManager.wait()
    const [managerId] = await factory.getManagerIds()
    const [managerAddress, registryAddress, upkeepAddress, viewsAddress] = await factory.getManagerConfig(managerId)
    console.log(`Default CasimirManager contract deployed to ${managerAddress}`)
    console.log(`Default CasimirRegistry contract deployed to ${registryAddress}`)
    console.log(`Default CasimirUpkeep contract deployed to ${upkeepAddress}`)
    console.log(`Default CasimirViews contract deployed to ${viewsAddress}`)
    const manager = await ethers.getContractAt('CasimirManager', managerAddress) as CasimirManager
    const registry = await ethers.getContractAt('CasimirRegistry', registryAddress) as CasimirRegistry
    const upkeep = await ethers.getContractAt('CasimirUpkeep', upkeepAddress) as CasimirUpkeep
    const views = await ethers.getContractAt('CasimirViews', viewsAddress) as CasimirViews

    requestConfig.args[1] = viewsAddress
    const fulfillGasLimit = 300000
    const setRequest = await upkeep.setFunctionsRequest(requestConfig.source, requestConfig.args, fulfillGasLimit)
    await setRequest.wait()

    await functionsBillingRegistry.setAuthorizedSenders([donTransmitter.address, functionsOracle.address])
    await functionsOracle.setRegistry(functionsBillingRegistry.address)
    await functionsOracle.addAuthorizedSenders([donTransmitter.address, managerAddress])

    const ssvViews = await ethers.getContractAt(ISSVViewsAbi, process.env.SSV_VIEWS_ADDRESS as string) as ISSVViews
    const preregisteredOperatorIds = process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [208, 209, 210, 211/*, 212, 213, 214, 215*/]
    if (preregisteredOperatorIds.length < 4) throw new Error('Not enough operator ids provided')
    const preregisteredBalance = ethers.utils.parseEther('10')
    for (const operatorId of preregisteredOperatorIds) {
        const [operatorOwnerAddress] = await ssvViews.getOperatorById(operatorId)
        const currentBalance = await ethers.provider.getBalance(operatorOwnerAddress)
        const nextBalance = currentBalance.add(preregisteredBalance)
        await setBalance(operatorOwnerAddress, nextBalance)
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [operatorOwnerAddress]
        })
        const operatorSigner = ethers.provider.getSigner(operatorOwnerAddress)
        const result = await registry.connect(operatorSigner).registerOperator(operatorId, { value: preregisteredBalance })
        await result.wait()
    }

    /**
     * We are simulating the oracle reporting on a more frequent basis
     * We also do not sweep or compound the rewards in this script
     * Exit balances are swept as needed
     */
    const blocksPerReport = 10
    const rewardPerValidator = 0.105
    let lastReportBlock = await ethers.provider.getBlockNumber()
    let lastStakedPoolIds: number[] = []
    void function () {
        ethers.provider.on('block', async (block) => {
            if (block - blocksPerReport >= lastReportBlock) {
                await time.increase(time.duration.days(1))
                console.log('⌛️ Report period complete')
                lastReportBlock = await ethers.provider.getBlockNumber()
                await runUpkeep({ donTransmitter, upkeep })
                const pendingPoolIds = await manager.getPendingPoolIds()
                const stakedPoolIds = await manager.getStakedPoolIds()
                if (pendingPoolIds.length + stakedPoolIds.length) {
                    console.log('🧾 Submitting report')
                    const activatedBalance = pendingPoolIds.length * 32
                    const sweptRewardBalance = rewardPerValidator * lastStakedPoolIds.length
                    const exitingPoolCount = await manager.requestedExits()
                    const sweptExitedBalance = exitingPoolCount.toNumber() * 32
                    const rewardBalance = rewardPerValidator * stakedPoolIds.length
                    const latestBeaconBalance = await manager.latestBeaconBalance()
                    const nextBeaconBalance = round(parseFloat(ethers.utils.formatEther(latestBeaconBalance)) + activatedBalance + rewardBalance - sweptRewardBalance - sweptExitedBalance, 10)
                    const nextActivatedDeposits = (await manager.getPendingPoolIds()).length
                    for (const poolId of lastStakedPoolIds) {
                        const poolAddress = await manager.getPoolAddress(poolId)
                        const currentBalance = await ethers.provider.getBalance(poolAddress)
                        const nextBalance = currentBalance.add(ethers.utils.parseEther(rewardPerValidator.toString()))
                        await setBalance(poolAddress, nextBalance)
                    }
                    const startIndex = ethers.BigNumber.from(0)
                    const endIndex = ethers.BigNumber.from(stakedPoolIds.length)
                    const compoundablePoolIds = await views.getCompoundablePoolIds(startIndex, endIndex)
                    const reportValues = {
                        beaconBalance: nextBeaconBalance,
                        sweptBalance: sweptRewardBalance + sweptExitedBalance,
                        activatedDeposits: nextActivatedDeposits,
                        forcedExits: 0,
                        completedExits: exitingPoolCount.toNumber(),
                        compoundablePoolIds
                    }
                    console.log('🧾 Report values', reportValues)
                    await fulfillReport({
                        donTransmitter,
                        upkeep,
                        functionsBillingRegistry,
                        values: reportValues
                    })
                    let remaining = exitingPoolCount.toNumber()
                    if (remaining) {
                        for (const poolId of stakedPoolIds) {
                            if (remaining === 0) break
                            const poolConfig = await views.getPoolConfig(poolId)
                            if (poolConfig.status === PoolStatus.EXITING_FORCED || poolConfig.status === PoolStatus.EXITING_REQUESTED) {
                                remaining--
                                const poolAddress = await manager.getPoolAddress(poolId)
                                const currentBalance = await ethers.provider.getBalance(poolAddress)
                                const poolSweptExitedBalance = sweptExitedBalance / exitingPoolCount.toNumber()
                                const nextBalance = currentBalance.add(ethers.utils.parseEther(poolSweptExitedBalance.toString()))
                                await setBalance(poolAddress, nextBalance)
                            }
                        }
                        let finalizableCompletedExits = await manager.finalizableCompletedExits()
                        while (finalizableCompletedExits.toNumber() !== exitingPoolCount.toNumber()) {
                            finalizableCompletedExits = await manager.finalizableCompletedExits()
                        }
                    }
                    await runUpkeep({ donTransmitter, upkeep })
                }
                lastStakedPoolIds = stakedPoolIds
            }
        })
    }()

    setTimeout(async () => {
        const depositAmount = 32 * ((100 + await manager.userFee()) / 100)
        const depositStake = await manager.connect(firstUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
        await depositStake.wait()
    }, 2500)

    process.env.FACTORY_ADDRESS = factory.address
    process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS = functionsBillingRegistry.address
    process.env.FUNCTIONS_ORACLE_ADDRESS = functionsOracle.address
    run('npm run dev --workspace @casimir/oracle')
}()
