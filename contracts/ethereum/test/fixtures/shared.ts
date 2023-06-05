import { ethers, network } from 'hardhat'
import { loadFixture, time, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { deployContract } from '@casimir/ethereum/helpers/deploy'
import { CasimirManager, CasimirRegistry, CasimirUpkeep, ISSVNetworkViews } from '@casimir/ethereum/build/artifacts/types'
import { fulfillReport, runUpkeep } from '@casimir/ethereum/helpers/upkeep'
import { initiateDepositHandler, reportCompletedExitsHandler } from '@casimir/ethereum/helpers/oracle'
import { round } from '@casimir/ethereum/helpers/math'
import { ContractConfig, DeploymentConfig } from '@casimir/types'
import ISSVNetworkViewsJson from '@casimir/ethereum/build/artifacts/scripts/resources/ssv-network/contracts/ISSVNetworkViews.sol/ISSVNetworkViews.json'

/** Fixture to deploy SSV manager contract */
export async function deploymentFixture() {
    const [owner, , , , , keeper, oracle] = await ethers.getSigners()
    let config: DeploymentConfig = {
        CasimirManager: {
            address: '',
            args: {
                oracleAddress: oracle.address || process.env.ORACLE_ADDRESS,
                beaconDepositAddress: process.env.BEACON_DEPOSIT_ADDRESS,
                linkFunctionsAddress: process.env.LINK_FUNCTIONS_ADDRESS,
                linkRegistryAddress: process.env.LINK_REGISTRY_ADDRESS,
                linkSubscriptionId: process.env.LINK_SUBSCRIPTION_ID,
                linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
                ssvNetworkAddress: process.env.SSV_NETWORK_ADDRESS,
                ssvNetworkViewsAddress: process.env.SSV_NETWORK_VIEWS_ADDRESS,
                ssvTokenAddress: process.env.SSV_TOKEN_ADDRESS,
                swapFactoryAddress: process.env.SWAP_FACTORY_ADDRESS,
                swapRouterAddress: process.env.SWAP_ROUTER_ADDRESS,
                wethTokenAddress: process.env.WETH_TOKEN_ADDRESS
            },
            options: {},
            proxy: false
        }
    }

    /** Insert any mock external contracts first */
    if (process.env.MOCK_EXTERNAL_CONTRACTS === 'true') {
        config = {
            MockFunctionsOracle: {
                address: '',
                args: {},
                options: {},
                proxy: false
            },
            ...config
        }
    }

    for (const name in config) {
        console.log(`Deploying ${name} contract...`)

        /** Link mock external contracts to Casimir */
        if (name === 'CasimirManager') {
            (config[name as keyof typeof config] as ContractConfig).args.linkFunctionsAddress = config.MockFunctionsOracle?.address
        }

        const { args, options, proxy } = config[name as keyof typeof config] as ContractConfig

        const contract = await deployContract(name, proxy, args, options)
        const { address } = contract

        // Semi-colon needed
        console.log(`${name} contract deployed to ${address}`);

        // Save contract address for next loop
        (config[name as keyof DeploymentConfig] as ContractConfig).address = address
    }

    const manager = await ethers.getContractAt('CasimirManager', config.CasimirManager.address as string) as CasimirManager
    const registry = await ethers.getContractAt('CasimirRegistry', await manager.getRegistryAddress()) as CasimirRegistry
    const upkeep = await ethers.getContractAt('CasimirUpkeep', await manager.getUpkeepAddress()) as CasimirUpkeep
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

    return { manager: manager as CasimirManager, upkeep: upkeep as CasimirUpkeep, owner, keeper, oracle }
}

/** Fixture to stake 16 for the first user */
export async function firstUserDepositFixture() {
    const { manager, upkeep, owner, keeper, oracle } = await loadFixture(deploymentFixture)
    const [, firstUser] = await ethers.getSigners()

    const depositAmount = round(16 * ((100 + await manager.getFeePercent()) / 100), 10)
    const deposit = await manager.connect(firstUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    return { manager, upkeep, owner, firstUser, keeper, oracle }
}

/** Fixture to stake 24 for the second user */
export async function secondUserDepositFixture() {
    const { manager, upkeep, owner, firstUser, keeper, oracle } = await loadFixture(firstUserDepositFixture)
    const [, , secondUser] = await ethers.getSigners()

    const depositAmount = round(24 * ((100 + await manager.getFeePercent()) / 100), 10)
    const deposit = await manager.connect(secondUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    const nextPoolId = 1
    await initiateDepositHandler({ manager, signer: oracle, args: { poolId: nextPoolId } })
    
    await time.increase(time.duration.days(1))   

    await runUpkeep({ upkeep, keeper })
 
    let requestId = 0
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

    return { manager, upkeep, owner, firstUser, secondUser, keeper, oracle, requestId }
}

/** Fixture to report increase of 0.105 in total rewards before fees */
export async function rewardsPostSecondUserDepositFixture() {
    const { manager, upkeep, owner, firstUser, secondUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(secondUserDepositFixture)

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    let requestId = latestRequestId
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

    return { manager, upkeep, owner, firstUser, secondUser, keeper, oracle, requestId }
}

/** Fixture to sweep 0.105 to the manager */
export async function sweepPostSecondUserDepositFixture() {
    const { manager, upkeep, owner, firstUser, secondUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(secondUserDepositFixture)

    const sweptRewards = 0.105
    const stakedPoolIds = await manager.getStakedPoolIds()
    for (const poolId of stakedPoolIds) {
        const poolAddress = await manager.getPoolAddress(poolId)
        const poolSweptRewards = sweptRewards / stakedPoolIds.length
        const currentBalance = await ethers.provider.getBalance(poolAddress)
        const nextBalance = currentBalance.add(ethers.utils.parseEther(poolSweptRewards.toString()))
        await setBalance(poolAddress, nextBalance)
    }

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    let requestId = latestRequestId
    const compoundablePoolIds = [0, 0, 0, 0, 0]
    for (let i = 0; i < compoundablePoolIds.length; i++) {
        if (i < stakedPoolIds.length) compoundablePoolIds[i] = stakedPoolIds[i]
    }
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

    return { manager, upkeep, owner, firstUser, secondUser, keeper, oracle, requestId }
}

/** Fixture to stake 24 for the third user */
export async function thirdUserDepositFixture() {
    const { manager, upkeep, owner, firstUser, secondUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(sweepPostSecondUserDepositFixture)
    const [, , , thirdUser] = await ethers.getSigners()

    const depositAmount = round(24 * ((100 + await manager.getFeePercent()) / 100), 10)
    const deposit = await manager.connect(thirdUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    const readyPools = await manager.getReadyPoolIds()
    const nextPoolId = readyPools[readyPools.length - 1]
    await initiateDepositHandler({ manager, signer: oracle, args: { poolId: nextPoolId } })

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    let requestId = latestRequestId
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

    return { manager, upkeep, owner, firstUser, secondUser, thirdUser, keeper, oracle, requestId }
}

/** Fixture to report increase of 0.21 in total rewards before fees */
export async function rewardsPostThirdUserDepositFixture() {
    const { manager, upkeep, owner, firstUser, secondUser, thirdUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(thirdUserDepositFixture)

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    let requestId = latestRequestId
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

    return { manager, upkeep, owner, firstUser, secondUser, thirdUser, keeper, oracle, requestId }
}

/** Fixture to sweep 0.21 to the manager */
export async function sweepPostThirdUserDepositFixture() {
    const { manager, upkeep, owner, firstUser, secondUser, thirdUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(rewardsPostThirdUserDepositFixture)

    const sweptRewards = 0.21
    const stakedPoolIds = await manager.getStakedPoolIds()
    for (const poolId of stakedPoolIds) {
        const poolAddress = await manager.getPoolAddress(poolId)
        const poolSweptRewards = sweptRewards / stakedPoolIds.length
        const currentBalance = await ethers.provider.getBalance(poolAddress)
        const nextBalance = currentBalance.add(ethers.utils.parseEther(poolSweptRewards.toString()))
        await setBalance(poolAddress, nextBalance)
    }

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    let requestId = latestRequestId
    const compoundablePoolIds = [0, 0, 0, 0, 0]
    for (let i = 0; i < compoundablePoolIds.length; i++) {
        if (i < stakedPoolIds.length) compoundablePoolIds[i] = stakedPoolIds[i]
    }
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

    return { manager, upkeep, owner, firstUser, secondUser, thirdUser, keeper, oracle, requestId }
}

/** Fixture to partial withdraw 0.3 to the first user */
export async function firstUserPartialWithdrawalFixture() {
    const { manager, upkeep, firstUser, secondUser, thirdUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(sweepPostThirdUserDepositFixture)
    const prepoolBalance = await manager.getPrepoolBalance()
    const withdraw = await manager.connect(firstUser).requestWithdrawal(prepoolBalance)
    await withdraw.wait()

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    let requestId = latestRequestId
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

    return { manager, upkeep, firstUser, secondUser, thirdUser, keeper, oracle, requestId }
}

/** Fixture to stake 72 for the fourth user */
export async function fourthUserDepositFixture() {
    const { manager, upkeep, firstUser, secondUser, thirdUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(firstUserPartialWithdrawalFixture)
    const [, , , , fourthUser] = await ethers.getSigners()

    const depositAmount = round(72 * ((100 + await manager.getFeePercent()) / 100), 10)
    const deposit = await manager.connect(fourthUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    /** Initiate next ready pools (2) */
    const readyPools = await manager.getReadyPoolIds()
    for (let i = 0; i < 2; i++) {
        const nextPoolId = readyPools[i]
        await initiateDepositHandler({ manager, signer: oracle, args: { poolId: nextPoolId } })
    }

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    let requestId = latestRequestId
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

    return { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId }
}

/** Fixture to simulate a validator stake penalty that decreases the active balance */
export async function activeBalanceLossFixture() {
    const { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(fourthUserDepositFixture)

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    let requestId = latestRequestId

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

    return { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId }
}

/** Fixture to simulate a validator reward that brings the active balance back to expected */
export async function activeBalanceRecoveryFixture() {
    const { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(activeBalanceLossFixture)

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

    return { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId }
}

/** Fixture to full withdraw ~24.07 */
export async function thirdUserFullWithdrawalFixture() {
    const { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(activeBalanceRecoveryFixture)

    const thirdStake = await manager.getUserStake(thirdUser.address)
    const withdraw = await manager.connect(thirdUser).requestWithdrawal(thirdStake)
    await withdraw.wait()

    const sweptExitedBalance = 32
    const withdrawnPoolId = (await manager.getStakedPoolIds())[0]
    const withdrawnPoolAddress = await manager.getPoolAddress(withdrawnPoolId)
    const currentBalance = await ethers.provider.getBalance(withdrawnPoolAddress)
    const nextBalance = currentBalance.add(ethers.utils.parseEther(sweptExitedBalance.toString()))
    await setBalance(withdrawnPoolAddress, nextBalance)

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    let requestId = latestRequestId

    const nextValues = {
        activeBalance: 128,
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

    await reportCompletedExitsHandler({ manager, signer: oracle, args: { count: 1 } })

    await runUpkeep({ upkeep, keeper })

    return { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId }
}

/** Fixture to simulate stakes and rewards */
export async function simulationFixture() {
    const { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId: latestRequestId } = await loadFixture(thirdUserFullWithdrawalFixture)

    const rewardsPerValidator = 0.105
    let nextActiveBalance = 96
    let totalRewards = 0
    let requestId = latestRequestId

    for (let i = 0; i < 5; i++) {
        const stakedPoolIds = await manager.getStakedPoolIds()
        await time.increase(time.duration.days(1))

        await runUpkeep({ upkeep, keeper })

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
    for (const poolId of stakedPoolIds) {
        const poolAddress = await manager.getPoolAddress(poolId)
        const poolSweptRewards = sweptRewards / stakedPoolIds.length
        const currentBalance = await ethers.provider.getBalance(poolAddress)
        const nextBalance = currentBalance.add(ethers.utils.parseEther(poolSweptRewards.toString()))
        await setBalance(poolAddress, nextBalance)
    }

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    const compoundablePoolIds = [0, 0, 0, 0, 0]
    for (let i = 0; i < compoundablePoolIds.length; i++) {
        if (i < stakedPoolIds.length) compoundablePoolIds[i] = stakedPoolIds[i]
    }
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

    return { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId }
}