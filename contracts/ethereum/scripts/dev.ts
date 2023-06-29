import { CasimirManager, CasimirRegistry, ISSVNetworkViews, CasimirViews, CasimirUpkeep } from '@casimir/ethereum/build/artifacts/types'
import { ethers, network } from 'hardhat'
import { fulfillReport, runUpkeep } from '@casimir/ethereum/helpers/upkeep'
import { round } from '@casimir/ethereum/helpers/math'
import { time, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import ISSVNetworkViewsJson from '@casimir/ethereum/build/artifacts/scripts/resources/ssv-network/contracts/ISSVNetworkViews.sol/ISSVNetworkViews.json'
import { depositUpkeepBalanceHandler, initiateDepositHandler, reportCompletedExitsHandler } from '../helpers/oracle'
import { getEventsIterable } from '@casimir/oracle/src/providers/events'
import { fetchRetry } from '@casimir/helpers'

void async function () {
    const [, , , , fourthUser, keeper, oracle] = await ethers.getSigners()

    const mockFunctionsOracleFactory = await ethers.getContractFactory('MockFunctionsOracle')
    const mockFunctionsOracle = await mockFunctionsOracleFactory.deploy()
    await mockFunctionsOracle.deployed()
    console.log(`MockFunctionsOracle contract deployed to ${mockFunctionsOracle.address}`)

    const managerArgs = {
        oracleAddress: oracle.address,
        beaconDepositAddress: process.env.BEACON_DEPOSIT_ADDRESS,
        linkFunctionsAddress: mockFunctionsOracle.address,
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
    const ssvNetworkViews = await ethers.getContractAt(ISSVNetworkViewsJson.abi, process.env.SSV_NETWORK_VIEWS_ADDRESS as string) as ISSVNetworkViews

    for (const operatorId of [1, 2, 3, 4]) {
        const [ operatorOwnerAddress ] = await ssvNetworkViews.getOperatorById(operatorId)
        const currentBalance = await ethers.provider.getBalance(operatorOwnerAddress)
        const nextBalance = currentBalance.add(ethers.utils.parseEther('4'))
        await setBalance(operatorOwnerAddress, nextBalance)
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [operatorOwnerAddress]
        })
        const operatorSigner = ethers.provider.getSigner(operatorOwnerAddress)
        const result = await registry.connect(operatorSigner).registerOperator(operatorId, { value: ethers.utils.parseEther('4') })
        await result.wait()
    }

    /**
     * We are simulating the oracle reporting on a more frequent basis
     * We also do not sweep or compound the rewards in this script
     * Exit balances are swept as needed
     */
    let requestId = 0
    const blocksPerReport = 10
    const rewardPerValidator = 0.105
    let lastReportBlock = await ethers.provider.getBlockNumber()

    void function () {
        console.log('STARTING REPORTER')

        ethers.provider.on('block', async (block) => {
            if (block - blocksPerReport >= lastReportBlock) {
                await time.increase(time.duration.days(1))
                lastReportBlock = await ethers.provider.getBlockNumber()
                await runUpkeep({ upkeep, keeper })
                const stakedPoolIds = await manager.getStakedPoolIds()
                const stakedPoolCount = stakedPoolIds.length
                const pendingPoolCount = (await manager.getPendingPoolIds()).length
                if (pendingPoolCount + stakedPoolCount > 0) {
                    const activatedBalance = pendingPoolCount * 32
                    const exitingPoolCount = await manager.requestedExits()
                    const sweptExitedBalance = exitingPoolCount.toNumber() * 32
                    const rewardAmount = rewardPerValidator * stakedPoolCount
                    const latestActiveBalance = await manager.latestActiveBalance()
                    const nextActiveBalance = round(parseFloat(ethers.utils.formatEther(latestActiveBalance)) + activatedBalance - sweptExitedBalance + rewardAmount, 10)
                    const nextActivatedDeposits = (await manager.getPendingPoolIds()).length
                    const nextValues = {
                        activeBalance: nextActiveBalance,
                        sweptBalance: sweptExitedBalance,
                        activatedDeposits: nextActivatedDeposits,
                        forcedExits: 0,
                        completedExits: exitingPoolCount.toNumber(),
                        compoundablePoolIds: [0, 0, 0, 0, 0]
                    }
                    requestId = await fulfillReport({
                        upkeep,
                        keeper,
                        values: nextValues,
                        requestId
                    })
                    let remaining = exitingPoolCount.toNumber()
                    if (remaining) {
                        for (const poolId of stakedPoolIds) {
                            if (remaining === 0) break
                            const poolDetails = await views.getPoolDetails(poolId)
                            if (poolDetails.status === 3) {
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
            }
        })
    }()

    setTimeout(async () => {
        if (process.env.MOCK_ORACLE === 'true') {
            const ping = await fetchRetry('http://localhost:3000/ping')
            const { message } = await ping.json()
            if (message !== 'pong') throw new Error('DKG service is not running')
        }
        const depositAmount = 32 * ((100 + await manager.feePercent()) / 100)
        const stake = await manager.connect(fourthUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
        await stake?.wait()
        // Todo handle in oracle and only run here if (!process.env.MOCK_ORACLE)
        await depositUpkeepBalanceHandler({ manager, signer: oracle })
    }, 2500)

    console.log('STARTING KEEPER')

    /**
     * We are simulating the DAO oracle (@casimir/oracle) using the oracle helper
     */
    if (process.env.MOCK_ORACLE === 'false') {

        console.log('STARTING ORACLE')

        const handlers = {
            DepositRequested: initiateDepositHandler,
            /**
             * We don't need to handle these/they aren't ready:
             * ResharesRequested: initiateResharesHandler,
             * ExitRequested: initiateExitsHandler,
             * ForcedExitReportsRequested: reportForcedExitsHandler,
             */
            CompletedExitReportsRequested: reportCompletedExitsHandler
        }

        console.log('GOT HANDLERS', handlers)

        const eventsIterable = getEventsIterable({ manager, events: Object.keys(handlers) })
        
        console.log('GOT EVENTS ITERABLE', eventsIterable)
        
        for await (const event of eventsIterable) {
            const details = event?.[event.length - 1]
            const { args } = details
            const handler = handlers[details.event as keyof typeof handlers]
            if (!handler) throw new Error(`No handler found for event ${details.event}`)
            await handler({ 
                manager,
                views,
                signer: oracle,
                args
            })
        }
    }
}()