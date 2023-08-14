import { CasimirManager, CasimirRegistry, ISSVNetworkViews, CasimirViews, CasimirUpkeep } from '../build/@types'
import { ethers, network } from 'hardhat'
import { fulfillReport, runUpkeep } from '@casimir/ethereum/helpers/upkeep'
import { round } from '@casimir/ethereum/helpers/math'
import { time, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import ISSVNetworkViewsAbi from '../build/abi/ISSVNetworkViews.json'
import { depositUpkeepBalanceHandler } from '../helpers/oracle'
import { fetchRetry, run } from '@casimir/helpers'
import { PoolStatus } from '@casimir/types'

/**
 * Deploy contracts to local network and run local events and oracle handling
 */
void async function () {
    const [, , , , fourthUser, keeper, oracle] = await ethers.getSigners()
    
    const preregisteredOperatorIds = process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [654, 655, 656, 657]
    if (preregisteredOperatorIds.length < 4) throw new Error('Not enough operator ids provided')
    const messengerUrl = process.env.MESSENGER_URL || 'https://nodes.casimir.co/eth/goerli/dkg/messenger'
    
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
    const ssvNetworkViews = await ethers.getContractAt(ISSVNetworkViewsAbi, process.env.SSV_NETWORK_VIEWS_ADDRESS as string) as ISSVNetworkViews

    const preregisteredBalance = ethers.utils.parseEther('10')
    for (const operatorId of preregisteredOperatorIds) {
        const [ operatorOwnerAddress ] = await ssvNetworkViews.getOperatorById(operatorId)
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
    let requestId = 0
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
                    const sweptRewardBalance =  rewardPerValidator * lastStakedPoolIds.length
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
                    requestId = await fulfillReport({
                        upkeep,
                        keeper,
                        values: reportValues,
                        requestId
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
        const depositAmount = 32 * ((100 + await manager.feePercent()) / 100)
        const stake = await manager.connect(fourthUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
        await stake?.wait()
        // Todo handle in oracle
        await depositUpkeepBalanceHandler({ manager, signer: oracle })
    }, 2500)

    run('npm run dev --workspace @casimir/oracle')
}()
