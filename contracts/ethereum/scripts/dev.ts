import { CasimirManager, CasimirRegistry, ISSVNetworkViews, CasimirViews, CasimirUpkeep, FunctionsOracleFactory, FunctionsBillingRegistry } from '../build/@types'
import { ethers, network } from 'hardhat'
import { fulfillReport, runUpkeep } from '@casimir/ethereum/helpers/upkeep'
import { round } from '@casimir/ethereum/helpers/math'
import { time, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import ISSVNetworkViewsAbi from '../build/abi/ISSVNetworkViews.json'
import { fetchRetry, run } from '@casimir/helpers'
import { PoolStatus } from '@casimir/types'
import { requestConfig } from '@casimir/functions'

/**
 * Deploy contracts to local network and run local events and oracle handling
 */
void async function () {
    const [, , , , fourthUser, keeper, daoOracle] = await ethers.getSigners()

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

    const managerArgs = {
        daoOracleAddress: daoOracle.address,
        beaconDepositAddress: process.env.BEACON_DEPOSIT_ADDRESS,
        functionsBillingRegistryAddress: functionsBillingRegistry.address,
        functionsOracleAddress: functionsOracle.address,
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
    const manager = await managerFactory.deploy(...Object.values(managerArgs)) as CasimirManager
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
    const views = await viewsFactory.deploy(...Object.values(viewsArgs)) as CasimirViews
    console.log(`CasimirViews contract deployed to ${views.address}`)

    const registry = await ethers.getContractAt('CasimirRegistry', registryAddress) as CasimirRegistry
    const upkeep = await ethers.getContractAt('CasimirUpkeep', upkeepAddress) as CasimirUpkeep
    const ssvNetworkViews = await ethers.getContractAt(ISSVNetworkViewsAbi, process.env.SSV_NETWORK_VIEWS_ADDRESS as string) as ISSVNetworkViews

    const preregisteredOperatorIds = process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [654, 655, 656, 657]
    if (preregisteredOperatorIds.length < 4) throw new Error('Not enough operator ids provided')
    const messengerUrl = process.env.MESSENGER_URL || 'https://nodes.casimir.co/eth/goerli/dkg/messenger'
    const preregisteredBalance = ethers.utils.parseEther('10')
    for (const operatorId of preregisteredOperatorIds) {
        const [operatorOwnerAddress] = await ssvNetworkViews.getOperatorById(operatorId)
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

    const secrets = '0x' // Parse requestConfig.secrets and encrypt if necessary
    const requestCBOR = await upkeep.generateRequest(requestConfig.source, secrets, requestConfig.args)
    const fulfillGasLimit = 300000
    const setRequest = await manager.setFunctionsRequest(requestCBOR, fulfillGasLimit)
    await setRequest.wait()

    await functionsBillingRegistry.setAuthorizedSenders([keeper.address, manager.address, upkeep.address, functionsOracle.address])
    await functionsOracle.setRegistry(functionsBillingRegistry.address)
    await functionsOracle.addAuthorizedSenders([keeper.address, manager.address])

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
                await runUpkeep({ upkeep, keeper })
                const pendingPoolIds = await manager.getPendingPoolIds()
                const stakedPoolIds = await manager.getStakedPoolIds()
                if (pendingPoolIds.length + stakedPoolIds.length) {
                    console.log('🧾 Submitting report')
                    const activatedBalance = pendingPoolIds.length * 32
                    const sweptRewardBalance = rewardPerValidator * lastStakedPoolIds.length
                    const exitingPoolCount = await manager.requestedExits()
                    const sweptExitedBalance = exitingPoolCount.toNumber() * 32
                    const rewardBalance = rewardPerValidator * stakedPoolIds.length
                    const latestActiveBalance = await manager.latestActiveBalance()
                    const nextActiveBalance = round(parseFloat(ethers.utils.formatEther(latestActiveBalance)) + activatedBalance + rewardBalance - sweptRewardBalance - sweptExitedBalance, 10)
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
                        activeBalance: nextActiveBalance,
                        sweptBalance: sweptRewardBalance + sweptExitedBalance,
                        activatedDeposits: nextActivatedDeposits,
                        forcedExits: 0,
                        completedExits: exitingPoolCount.toNumber(),
                        compoundablePoolIds
                    }
                    console.log('🧾 Report values', reportValues)
                    await fulfillReport({
                        keeper,
                        upkeep,
                        functionsBillingRegistry,
                        values: reportValues
                    })
                    let remaining = exitingPoolCount.toNumber()
                    if (remaining) {
                        for (const poolId of stakedPoolIds) {
                            if (remaining === 0) break
                            const poolDetails = await views.getPoolDetails(poolId)
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
                    await runUpkeep({ upkeep, keeper })
                }
                lastStakedPoolIds = stakedPoolIds
            }
        })
    }()

    setTimeout(async () => {
        const ping = await fetchRetry(`${messengerUrl}/ping`)
        const { message } = await ping.json()
        if (message !== 'pong') throw new Error('DKG service is not running')
        const depositAmount = 32 * ((100 + await manager.FEE_PERCENT()) / 100)
        const stake = await manager.connect(fourthUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
        await stake?.wait()
    }, 2500)

    process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS = functionsBillingRegistry.address
    run('npm run dev --workspace @casimir/oracle')
}()
