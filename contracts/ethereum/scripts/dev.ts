import { CasimirManager, CasimirRegistry, ISSVNetworkViews, CasimirViews, CasimirUpkeep } from '@casimir/ethereum/build/artifacts/types'
import { ethers, network } from 'hardhat'
import { fulfillReport, runUpkeep } from '@casimir/ethereum/helpers/upkeep'
import { round } from '@casimir/ethereum/helpers/math'
import EventEmitter, { on } from 'events'
import { time, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import ISSVNetworkViewsJson from '@casimir/ethereum/build/artifacts/scripts/resources/ssv-network/contracts/ISSVNetworkViews.sol/ISSVNetworkViews.json'
import { depositUpkeepBalanceHandler } from '../helpers/oracle'

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

    const depositAmount = 320 * ((100 + await manager.feePercent()) / 100)
    const stake = await manager.connect(fourthUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await stake?.wait()

    await depositUpkeepBalanceHandler({ manager, signer: oracle })

    let requestId = 0
    const blocksPerReward = 50
    const rewardPerValidator = 0.105
    let lastRewardBlock = await ethers.provider.getBlockNumber()
    for await (const block of on(ethers.provider as unknown as EventEmitter, 'block')) {
        if (block - blocksPerReward >= lastRewardBlock) {
            console.log('New reward block')
            lastRewardBlock = block
            const stakedPoolCount = (await manager.getStakedPoolIds()).length
            if (stakedPoolCount) {
                console.log(`Rewarding ${stakedPoolCount} validators ${rewardPerValidator} each`)
                await time.increase(time.duration.days(1))

                await runUpkeep({ upkeep, keeper })
                
                const rewardAmount = rewardPerValidator * stakedPoolCount
                let nextActiveBalance = round(
                    parseFloat(
                        ethers.utils.formatEther(
                            (await manager.latestActiveBalance()).add((await manager.getPendingPoolIds()).length * 32)
                        )
                    ) + rewardAmount
                )
                
                let nextActivatedDeposits = (await manager.getPendingPoolIds()).length
                let nextValues = {
                    activeBalance: nextActiveBalance,
                    sweptBalance: 0,
                    activatedDeposits: nextActivatedDeposits,
                    forcedExits: 0,
                    completedExits: 0,
                    compoundablePoolIds: [0, 0, 0, 0, 0]
                }

                requestId = await fulfillReport({
                    upkeep,
                    keeper,
                    values: nextValues,
                    requestId
                })

                await runUpkeep({ upkeep, keeper })

                const currentBalance = await ethers.provider.getBalance(manager.address)
                const nextBalance = currentBalance.add(ethers.utils.parseEther(rewardAmount.toString()))
                await setBalance(manager.address, nextBalance)

                await time.increase(time.duration.days(1))

                await runUpkeep({ upkeep, keeper })

                nextActiveBalance = round(
                    parseFloat(
                        ethers.utils.formatEther(
                            (await manager.latestActiveBalance()).add((await manager.getPendingPoolIds()).length * 32)
                        )
                    ) - rewardAmount
                )
                nextActivatedDeposits = (await manager.getPendingPoolIds()).length
                nextValues = {
                    activeBalance: nextActiveBalance,
                    sweptBalance: rewardAmount,
                    activatedDeposits: nextActivatedDeposits,
                    forcedExits: 0,
                    completedExits: 0,
                    compoundablePoolIds: [0, 0, 0, 0, 0]
                }

                requestId = await fulfillReport({
                    upkeep,
                    keeper,
                    values: nextValues,
                    requestId
                })

                await runUpkeep({ upkeep, keeper })
            }
        }
    }
}()