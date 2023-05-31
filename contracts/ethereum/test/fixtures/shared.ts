import { ethers } from 'hardhat'
import { loadFixture, time, setBalance } from '@nomicfoundation/hardhat-network-helpers'
import { deployContract } from '@casimir/ethereum/helpers/deploy'
import { CasimirManager, CasimirUpkeep } from '@casimir/ethereum/build/artifacts/types'
import { fulfillReportRequest, runUpkeep } from '@casimir/ethereum/helpers/upkeep'
import { initiatePoolDepositHandler, completePoolExitHandler } from '@casimir/ethereum/helpers/oracle'
import { round } from '@casimir/ethereum/helpers/math'
import { ContractConfig, DeploymentConfig } from '@casimir/types'

/** Fixture to deploy SSV manager contract */
export async function deploymentFixture() {
    const [owner, , , , , keeper, oracle] = await ethers.getSigners()
    let config: DeploymentConfig = {
        CasimirManager: {
            address: '',
            args: {
                oracleAddress: oracle.address || process.env.ORACLE_ADDRESS,
                beaconDepositAddress: process.env.BEACON_DEPOSIT_ADDRESS,
                functionsAddress: process.env.FUNCTIONS_ADDRESS,
                functionsSubscriptionId: process.env.FUNCTIONS_SUBSCRIPTION_ID,
                linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
                ssvNetworkAddress: process.env.SSV_NETWORK_ADDRESS,
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
            (config[name as keyof typeof config] as ContractConfig).args.functionsAddress = config.MockFunctionsOracle?.address
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
    const upkeep = await ethers.getContractAt('CasimirUpkeep', await manager.getUpkeepAddress()) as CasimirUpkeep

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
    await initiatePoolDepositHandler({ manager, signer: oracle, args: { poolId: nextPoolId } })
    
    await time.increase(time.duration.days(1))   

    await runUpkeep({ upkeep, keeper })
 
    let requestId = 0
    const nextValues = {
        activeBalance: 32,
        activatedDeposits: 1,
        unexpectedExits: 0,
        slashedExits: 0,
        withdrawnExits: 0
    }
    requestId = await fulfillReportRequest({
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
        activatedDeposits: 0,
        unexpectedExits: 0,
        slashedExits: 0,
        withdrawnExits: 0
    }
    requestId = await fulfillReportRequest({
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
    const currentBalance = await ethers.provider.getBalance(manager.address)
    const nextBalance = currentBalance.add(ethers.utils.parseEther(sweptRewards.toString()))
    await setBalance(manager.address, nextBalance)

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    let requestId = latestRequestId
    const nextValues = {
        activeBalance: 32,
        activatedDeposits: 0,
        unexpectedExits: 0,
        slashedExits: 0,
        withdrawnExits: 0
    }
    requestId = await fulfillReportRequest({
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
    await initiatePoolDepositHandler({ manager, signer: oracle, args: { poolId: nextPoolId } })

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    let requestId = latestRequestId
    const nextValues = {
        activeBalance: 64,
        activatedDeposits: 1,
        unexpectedExits: 0,
        slashedExits: 0,
        withdrawnExits: 0
    }
    requestId = await fulfillReportRequest({
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
        activatedDeposits: 0,
        unexpectedExits: 0,
        slashedExits: 0,
        withdrawnExits: 0
    }    
    requestId = await fulfillReportRequest({
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
    const currentBalance = await ethers.provider.getBalance(manager.address)
    const nextBalance = currentBalance.add(ethers.utils.parseEther(sweptRewards.toString()))
    await setBalance(manager.address, nextBalance)

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    let requestId = latestRequestId
    const nextValues = {
        activeBalance: 64,
        activatedDeposits: 0,
        unexpectedExits: 0,
        slashedExits: 0,
        withdrawnExits: 0
    }
    requestId = await fulfillReportRequest({
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
        activatedDeposits: 0,
        unexpectedExits: 0,
        slashedExits: 0,
        withdrawnExits: 0
    }
    requestId = await fulfillReportRequest({
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
        await initiatePoolDepositHandler({ manager, signer: oracle, args: { poolId: nextPoolId } })
    }

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    let requestId = latestRequestId
    const nextValues = {
        activeBalance: 128,
        activatedDeposits: 2,
        unexpectedExits: 0,
        slashedExits: 0,
        withdrawnExits: 0
    }
    requestId = await fulfillReportRequest({
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
        activatedDeposits: 0,
        unexpectedExits: 0,
        slashedExits: 0,
        withdrawnExits: 0
    }

    requestId = await fulfillReportRequest({
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
            activatedDeposits: 0,
            unexpectedExits: 0,
            slashedExits: 0,
            withdrawnExits: 0
        }

        requestId = await fulfillReportRequest({
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

    const sweptExitBalance = 32
    const currentBalance = await ethers.provider.getBalance(manager.address)
    const nextBalance = currentBalance.add(ethers.utils.parseEther(sweptExitBalance.toString()))
    await setBalance(manager.address, nextBalance)

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    let requestId = latestRequestId

    const nextValues = {
        activeBalance: 128,
        activatedDeposits: 0,
        unexpectedExits: 0,
        slashedExits: 0,
        withdrawnExits: 1
    }
    
    requestId = await fulfillReportRequest({
        upkeep,
        keeper,
        values: nextValues,
        requestId
    })

    await completePoolExitHandler({ manager, signer: oracle })

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
        const depositedPoolCount = await manager.getDepositedPoolCount()
        if (depositedPoolCount) {
            await time.increase(time.duration.days(1))

            await runUpkeep({ upkeep, keeper })

            const rewardsAmount = rewardsPerValidator * depositedPoolCount.toNumber()
            totalRewards += round(rewardsAmount, 10)
            nextActiveBalance = round(nextActiveBalance + rewardsAmount, 10)            
            
            const nextValues = {
                activeBalance: nextActiveBalance,
                activatedDeposits: 0,
                unexpectedExits: 0,
                slashedExits: 0,
                withdrawnExits: 0
            }

            requestId = await fulfillReportRequest({
                upkeep,
                keeper,
                values: nextValues,
                requestId
            })

            await runUpkeep({ upkeep, keeper })
        }
    }

    const sweptRewards = totalRewards
    const currentBalance = await ethers.provider.getBalance(manager.address)
    const nextBalance = currentBalance.add(ethers.utils.parseEther(sweptRewards.toString()))
    await setBalance(manager.address, nextBalance)

    await time.increase(time.duration.days(1))

    await runUpkeep({ upkeep, keeper })

    const nextValues = {
        activeBalance: 96,
        activatedDeposits: 0,
        unexpectedExits: 0,
        slashedExits: 0,
        withdrawnExits: 0
    }

    requestId = await fulfillReportRequest({
        upkeep,
        keeper,
        values: nextValues,
        requestId
    })

    await runUpkeep({ upkeep, keeper })

    return { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, oracle, requestId }
}