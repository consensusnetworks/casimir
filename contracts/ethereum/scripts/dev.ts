import { CasimirManager, CasimirRegistry, ISSVViews, CasimirViews, CasimirUpkeep, FunctionsOracleFactory, FunctionsBillingRegistry } from '../build/@types'
import { ethers, network, upgrades } from 'hardhat'
import { fulfillReport, runUpkeep } from '@casimir/ethereum/helpers/upkeep'
import { round } from '@casimir/ethereum/helpers/math'
import { time, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import ISSVViewsAbi from '../build/abi/ISSVViews.json'
import { fetchRetry } from '@casimir/fetch'
import { run } from '@casimir/shell'
import { PoolStatus } from '@casimir/types'
import requestConfig from '@casimir/functions/Functions-request-config'

upgrades.silenceWarnings()

/**
 * Deploy contracts to local network and run local events and oracle handling
 */
void async function () {
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

    const arrayFactory = await ethers.getContractFactory('CasimirArray')
    const arrayLibrary = await arrayFactory.deploy()
    console.log(`CasimirArray library deployed to ${arrayLibrary.address}`)

    const factoryFactory = await ethers.getContractFactory('CasimirFactory')
    const factoryLibrary = await factoryFactory.deploy()
    console.log(`CasimirFactory library deployed to ${factoryLibrary.address}`)

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
        ssvTokenAddress: process.env.SSV_TOKEN_ADDRESS,
        ssvViewsAddress: process.env.SSV_VIEWS_ADDRESS,
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
    const manager = await upgrades.deployProxy(managerFactory, Object.values(managerArgs), { unsafeAllow: ['constructor', 'external-library-linking'] }) as CasimirManager
    await manager.deployed()
    console.log(`CasimirManager contract deployed to ${manager.address}`)

    const registry = await ethers.getContractAt('CasimirRegistry', await manager.getRegistryAddress()) as CasimirRegistry
    console.log(`CasimirRegistry contract deployed to ${registry.address}`)

    const upkeep = await ethers.getContractAt('CasimirUpkeep', await manager.getUpkeepAddress()) as CasimirUpkeep
    console.log(`CasimirUpkeep contract deployed to ${upkeep.address}`)

    const viewsArgs = {
        managerAddress: manager.address,
        registryAddress: registry.address
    }
    const viewsFactory = await ethers.getContractFactory('CasimirViews')
    const views = await upgrades.deployProxy(viewsFactory, Object.values(viewsArgs), { unsafeAllow: ['constructor'] }) as CasimirViews
    await views.deployed()
    console.log(`CasimirViews contract deployed to ${views.address}`)

    const ssvViews = await ethers.getContractAt(ISSVViewsAbi, process.env.SSV_VIEWS_ADDRESS as string) as ISSVViews
    const preregisteredOperatorIds = process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [208, 209, 210, 211, 212, 213, 214, 215]
    if (preregisteredOperatorIds.length < 8) throw new Error('Not enough operator ids provided')
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

    requestConfig.args[1] = views.address
    const setRequest = await manager.setFunctionsRequest(requestConfig.source, requestConfig.args, 300000)
    await setRequest.wait()

    await functionsBillingRegistry.setAuthorizedSenders([donTransmitter.address, functionsOracle.address])
    await functionsOracle.setRegistry(functionsBillingRegistry.address)
    await functionsOracle.addAuthorizedSenders([donTransmitter.address, manager.address])

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
                            const poolDetails = await views.getPool(poolId)
                            if (poolDetails.status === PoolStatus.EXITING_FORCED || poolDetails.status === PoolStatus.EXITING_REQUESTED) {
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
        const depositAmount = 64 * ((100 + await manager.FEE_PERCENT()) / 100)
        const depositStake = await manager.connect(firstUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
        await depositStake?.wait()
    }, 2500)

    process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS = functionsBillingRegistry.address
    process.env.FUNCTIONS_ORACLE_ADDRESS = functionsOracle.address
    run('npm run dev --workspace @casimir/oracle')
}()
