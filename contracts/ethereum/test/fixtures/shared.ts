import { ethers, network } from 'hardhat'
import { loadFixture, time, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { CasimirManager, CasimirRegistry, CasimirUpkeep, CasimirViews, ISSVNetworkViews } from '../../build/@types'
import { fulfillReport, runUpkeep } from '../../helpers/upkeep'
import { depositUpkeepBalanceHandler, initiateDepositHandler, reportCompletedExitsHandler } from '../../helpers/oracle'
import { round } from '../../helpers/math'
import ISSVNetworkViewsAbi from '../../build/abi/ISSVNetworkViews.json'

/** Fixture to deploy SSV manager contract */
export async function deploymentFixture() {
    const [owner, , , , , keeper, oracle] = await ethers.getSigners()
    
    const preregisteredOperatorIds = process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [654, 655, 656, 657]
    if (preregisteredOperatorIds.length < 4) throw new Error('Not enough operator ids provided')

    const mockFunctionsOracleFactory = await ethers.getContractFactory('MockFunctionsOracle')
    const mockFunctionsOracle = await mockFunctionsOracleFactory.deploy()
    await mockFunctionsOracle.deployed()

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

    const registryAddress = await manager.getRegistryAddress()

    const upkeepAddress = await manager.getUpkeepAddress()

    const viewsArgs = {
        managerAddress: manager.address,
        registryAddress
    }
    const viewsFactory = await ethers.getContractFactory('CasimirViews')
    const views = await viewsFactory.deploy(...Object.values(viewsArgs)) as CasimirViews

    const registry = await ethers.getContractAt('CasimirRegistry', registryAddress) as CasimirRegistry
    const upkeep = await ethers.getContractAt('CasimirUpkeep', upkeepAddress) as CasimirUpkeep
    const ssvNetworkViews = await ethers.getContractAt(ISSVNetworkViewsAbi, process.env.SSV_NETWORK_VIEWS_ADDRESS as string) as ISSVNetworkViews

    for (const operatorId of preregisteredOperatorIds) {
        const [ operatorOwnerAddress ] = await ssvNetworkViews.getOperatorById(operatorId)
        const currentBalance = await ethers.provider.getBalance(operatorOwnerAddress)
        const nextBalance = currentBalance.add(ethers.utils.parseEther('10'))
        await setBalance(operatorOwnerAddress, nextBalance)
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [operatorOwnerAddress]
        })
        const operatorSigner = ethers.provider.getSigner(operatorOwnerAddress)
        const result = await registry.connect(operatorSigner).registerOperator(operatorId, { value: ethers.utils.parseEther('10') })
        await result.wait()
    }

    return { manager, registry, upkeep, views, ssvNetworkViews, owner, keeper, oracle }
}

/** Fixture to stake 16 for the first user */
export async function firstUserDepositFixture() {
    const { manager, registry, upkeep, views, owner, keeper, oracle } = await loadFixture(deploymentFixture)
    const [, firstUser] = await ethers.getSigners()

    const depositAmount = round(16 * ((100 + await manager.feePercent()) / 100), 10)
    const deposit = await manager.connect(firstUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    return { manager, registry, upkeep, views, owner, firstUser, keeper, oracle }
}

/** Fixture to stake 24 for the second user */
export async function secondUserDepositFixture() {
    const { manager, registry, upkeep, views, owner, firstUser, keeper, oracle } = await loadFixture(firstUserDepositFixture)
    const [, , secondUser] = await ethers.getSigners()

    const depositAmount = round(24 * ((100 + await manager.feePercent()) / 100), 10)
    const deposit = await manager.connect(secondUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()
    if ((await manager.upkeepId()).toNumber() === 0) {
        await depositUpkeepBalanceHandler({ manager, signer: oracle })
    }

    await initiateDepositHandler({ manager, signer: oracle })
    
    let requestId = 0
    await time.increase(time.duration.days(1))   
    await runUpkeep({ upkeep, keeper }) 
    const nextValues = {
        activeBalance: 32,
        sweptBalance: 0,
        activatedDeposits: 1,
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

    return { manager, registry, upkeep, views, owner, firstUser, secondUser, keeper, oracle, requestId }
}

/** Fixture to report increase of 0.105 in total rewards before fees */
export async function rewardsPostSecondUserDepositFixture() {
    const { manager, registry, upkeep, views, owner, firstUser, secondUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(secondUserDepositFixture)

    let requestId = latestRequestId
    await time.increase(time.duration.days(1))
    await runUpkeep({ upkeep, keeper })
    const nextValues = {
        activeBalance: 32.105,
        sweptBalance: 0,
        activatedDeposits: 0,
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

    return { manager, registry, upkeep, views, owner, firstUser, secondUser, keeper, oracle, requestId }
}

/** Fixture to sweep 0.105 to the manager */
export async function sweepPostSecondUserDepositFixture() {
    const { manager, registry, upkeep, views, owner, firstUser, secondUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(secondUserDepositFixture)

    let requestId = latestRequestId
    await time.increase(time.duration.days(1))
    await runUpkeep({ upkeep, keeper })
    const sweptRewards = 0.105
    const stakedPoolIds = await manager.getStakedPoolIds()
    for (const poolId of stakedPoolIds) {
        const poolAddress = await manager.getPoolAddress(poolId)
        const poolSweptRewards = sweptRewards / stakedPoolIds.length
        const currentBalance = await ethers.provider.getBalance(poolAddress)
        const nextBalance = currentBalance.add(ethers.utils.parseEther(poolSweptRewards.toString()))
        await setBalance(poolAddress, nextBalance)
    }
    const compoundablePoolIds = [1, 0, 0, 0, 0]
    const nextValues = {
        activeBalance: 32,
        sweptBalance: sweptRewards,
        activatedDeposits: 0,
        forcedExits: 0,
        completedExits: 0,
        compoundablePoolIds
    }
    requestId = await fulfillReport({
        upkeep,
        keeper,
        values: nextValues,
        requestId
    })
    await runUpkeep({ upkeep, keeper })

    return { manager, registry, upkeep, views, owner, firstUser, secondUser, keeper, oracle, requestId }
}

/** Fixture to stake 24 for the third user */
export async function thirdUserDepositFixture() {
    const { manager, registry, upkeep, views, owner, firstUser, secondUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(sweepPostSecondUserDepositFixture)
    const [, , , thirdUser] = await ethers.getSigners()

    const depositAmount = round(24 * ((100 + await manager.feePercent()) / 100), 10)
    const deposit = await manager.connect(thirdUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    await initiateDepositHandler({ manager, signer: oracle })

    let requestId = latestRequestId
    await time.increase(time.duration.days(1))
    await runUpkeep({ upkeep, keeper })
    const nextValues = {
        activeBalance: 64,
        sweptBalance: 0,
        activatedDeposits: 1,
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

    return { manager, registry, upkeep, views, owner, firstUser, secondUser, thirdUser, keeper, oracle, requestId }
}

/** Fixture to report increase of 0.21 in total rewards before fees */
export async function rewardsPostThirdUserDepositFixture() {
    const { manager, registry, upkeep, views, owner, firstUser, secondUser, thirdUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(thirdUserDepositFixture)

    let requestId = latestRequestId
    await time.increase(time.duration.days(1))
    await runUpkeep({ upkeep, keeper })
    const nextValues = {
        activeBalance: 64.21,
        sweptBalance: 0,
        activatedDeposits: 0,
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

    return { manager, registry, upkeep, views, owner, firstUser, secondUser, thirdUser, keeper, oracle, requestId }
}

/** Fixture to sweep 0.21 to the manager */
export async function sweepPostThirdUserDepositFixture() {
    const { manager, registry, upkeep, views, owner, firstUser, secondUser, thirdUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(rewardsPostThirdUserDepositFixture)

    let requestId = latestRequestId
    await time.increase(time.duration.days(1))
    await runUpkeep({ upkeep, keeper })
    const sweptRewards = 0.21
    const stakedPoolIds = await manager.getStakedPoolIds()
    for (const poolId of stakedPoolIds) {
        const poolAddress = await manager.getPoolAddress(poolId)
        const poolSweptRewards = sweptRewards / stakedPoolIds.length
        const currentBalance = await ethers.provider.getBalance(poolAddress)
        const nextBalance = currentBalance.add(ethers.utils.parseEther(poolSweptRewards.toString()))
        await setBalance(poolAddress, nextBalance)
    }
    const compoundablePoolIds = [1, 2, 0, 0, 0]
    const nextValues = {
        activeBalance: 64,
        sweptBalance: sweptRewards,
        activatedDeposits: 0,
        forcedExits: 0,
        completedExits: 0,
        compoundablePoolIds
    }
    requestId = await fulfillReport({
        upkeep,
        keeper,
        values: nextValues,
        requestId
    })
    await runUpkeep({ upkeep, keeper })

    return { manager, registry, upkeep, views, owner, firstUser, secondUser, thirdUser, keeper, oracle, requestId }
}

/** Fixture to partial withdraw 0.3 to the first user */
export async function firstUserPartialWithdrawalFixture() {
    const { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(sweepPostThirdUserDepositFixture)
    const withdrawableBalance = await manager.getWithdrawableBalance()
    const withdraw = await manager.connect(firstUser).requestWithdrawal(withdrawableBalance)
    await withdraw.wait()

    let requestId = latestRequestId
    await time.increase(time.duration.days(1))
    await runUpkeep({ upkeep, keeper })
    const nextValues = {
        activeBalance: 64,
        sweptBalance: 0,
        activatedDeposits: 0,
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

    return { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, keeper, oracle, requestId }
}

/** Fixture to stake 72 for the fourth user */
export async function fourthUserDepositFixture() {
    const { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(firstUserPartialWithdrawalFixture)
    const [, , , , fourthUser] = await ethers.getSigners()

    const depositAmount = round(72 * ((100 + await manager.feePercent()) / 100), 10)
    const deposit = await manager.connect(fourthUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    for (let i = 0; i < 2; i++) {
        await initiateDepositHandler({ manager, signer: oracle })
    }

    let requestId = latestRequestId
    await time.increase(time.duration.days(1))
    await runUpkeep({ upkeep, keeper })
    const nextValues = {
        activeBalance: 128,
        sweptBalance: 0,
        activatedDeposits: 2,
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

    return { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId }
}

/** Fixture to simulate a validator stake penalty that decreases the active balance */
export async function activeBalanceLossFixture() {
    const { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(fourthUserDepositFixture)

    let requestId = latestRequestId
    await time.increase(time.duration.days(1))
    await runUpkeep({ upkeep, keeper })
    const nextValues = {
        activeBalance: 126,
        sweptBalance: 0,
        activatedDeposits: 0,
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

    return { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId }
}

/** Fixture to simulate a validator reward that brings the active balance back to expected */
export async function activeBalanceRecoveryFixture() {
    const { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(activeBalanceLossFixture)

    let nextActiveBalance = 127
    let requestId = latestRequestId
    for (let i = 0; i < 2; i++) {
        await time.increase(time.duration.days(1))
        await runUpkeep({ upkeep, keeper })
        const nextValues = {
            activeBalance: nextActiveBalance,
            sweptBalance: 0,
            activatedDeposits: 0,
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
        nextActiveBalance += 1
    }

    return { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId }
}

/** Fixture to full withdraw ~24.07 */
export async function thirdUserFullWithdrawalFixture() {
    const { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(activeBalanceRecoveryFixture)

    const thirdStake = await manager.getUserStake(thirdUser.address)
    const withdraw = await manager.connect(thirdUser).requestWithdrawal(thirdStake)
    await withdraw.wait()
    
    let requestId = latestRequestId
    await time.increase(time.duration.days(1))
    await runUpkeep({ upkeep, keeper })
    const sweptExitedBalance = 32
    const nextValues = {
        activeBalance: 96,
        sweptBalance: sweptExitedBalance,
        activatedDeposits: 0,
        forcedExits: 0,
        completedExits: 1,
        compoundablePoolIds: [0, 0, 0, 0, 0]
    }
    requestId = await fulfillReport({
        upkeep,
        keeper,
        values: nextValues,
        requestId
    })
    const exitedPoolId = (await manager.getStakedPoolIds())[0]
    const exitedPoolAddress = await manager.getPoolAddress(exitedPoolId)
    const currentBalance = await ethers.provider.getBalance(exitedPoolAddress)
    const nextBalance = currentBalance.add(ethers.utils.parseEther(sweptExitedBalance.toString()))
    await setBalance(exitedPoolAddress, nextBalance)
    
    await reportCompletedExitsHandler({ manager, views, signer: oracle, args: { count: 1 } })

    await runUpkeep({ upkeep, keeper })

    return { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId }
}

/** Fixture to simulate rewards */
export async function simulationFixture() {
    const { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(thirdUserFullWithdrawalFixture)

    const rewardsPerValidator = 0.105
    let nextActiveBalance = 96
    let totalRewards = 0
    let requestId = latestRequestId
    for (let i = 0; i < 5; i++) {
        await time.increase(time.duration.days(1))
        await runUpkeep({ upkeep, keeper })
        const stakedPoolIds = await manager.getStakedPoolIds()
        const rewardsAmount = rewardsPerValidator * stakedPoolIds.length
        totalRewards += round(rewardsAmount, 10)
        nextActiveBalance = round(nextActiveBalance + rewardsAmount, 10)            
        const nextValues = {
            activeBalance: nextActiveBalance,
            sweptBalance: 0,
            activatedDeposits: 0,
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

    const sweptRewards = totalRewards
    const stakedPoolIds = await manager.getStakedPoolIds()
    await time.increase(time.duration.days(1))
    await runUpkeep({ upkeep, keeper })
    for (const poolId of stakedPoolIds) {
        const poolAddress = await manager.getPoolAddress(poolId)
        const poolSweptRewards = sweptRewards / stakedPoolIds.length
        const currentBalance = await ethers.provider.getBalance(poolAddress)
        const nextBalance = currentBalance.add(ethers.utils.parseEther(poolSweptRewards.toString()))
        await setBalance(poolAddress, nextBalance)
    }
    const compoundablePoolIds = [2, 3, 4, 0, 0]
    const nextValues = {
        activeBalance: 96,
        sweptBalance: sweptRewards,
        activatedDeposits: 0,
        forcedExits: 0,
        completedExits: 0,
        compoundablePoolIds
    }
    requestId = await fulfillReport({
        upkeep,
        keeper,
        values: nextValues,
        requestId
    })
    await runUpkeep({ upkeep, keeper })

    return { manager, registry, upkeep, views, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId }
}