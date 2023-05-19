import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { deployContract } from '@casimir/ethereum/helpers/deploy'
import { CasimirManager, CasimirUpkeep } from '@casimir/ethereum/build/artifacts/types'
import { fulfillFunctionsRequest, runUpkeep } from '@casimir/ethereum/helpers/upkeep'
import { initiatePoolDepositHander } from '@casimir/ethereum/helpers/dkg'
import { round } from '@casimir/ethereum/helpers/math'
import { ContractConfig, DeploymentConfig } from '@casimir/types'

const getSweptBalance = ethers.utils.id('getSweptBalance()').slice(0, 10)
console.log(getSweptBalance)

const getValidatorPublicKeys = ethers.utils.id('getValidatorPublicKeys()').slice(0, 10)
console.log(getValidatorPublicKeys)

/** Fixture to deploy SSV manager contract */
export async function deploymentFixture() {
    const [owner, , , , , keeper, dkg] = await ethers.getSigners()
    let config: DeploymentConfig = {
        CasimirManager: {
            address: '',
            args: {
                beaconDepositAddress: process.env.BEACON_DEPOSIT_ADDRESS,
                dkgOracleAddress: dkg.address || process.env.DKG_ORACLE_ADDRESS,
                functionsOracleAddress: process.env.FUNCTIONS_ORACLE_ADDRESS,
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
            (config[name as keyof typeof config] as ContractConfig).args.functionsOracleAddress = config.MockFunctionsOracle?.address
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

    return { manager: manager as CasimirManager, upkeep: upkeep as CasimirUpkeep, owner, keeper, dkg }
}

/** Fixture to stake 16 for the first user */
export async function firstUserDepositFixture() {
    const { manager, upkeep, owner, keeper, dkg } = await loadFixture(deploymentFixture)
    const [, firstUser] = await ethers.getSigners()

    const stakeAmount = 16
    const depositAmount = round(stakeAmount * ((100 + await manager.getFeePercent()) / 100), 10)
    const deposit = await manager.connect(firstUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    /** Run upkeep */
    await runUpkeep({ upkeep, keeper })

    return { manager, upkeep, owner, firstUser, keeper, dkg }
}

/** Fixture to stake 24 for the second user */
export async function secondUserDepositFixture() {
    const { manager, upkeep, owner, firstUser, keeper, dkg } = await loadFixture(firstUserDepositFixture)
    const [, , secondUser] = await ethers.getSigners()

    const stakeAmount = 24
    const nextActiveBalanceAmount = 32
    const nextSweptRewardsAmount = 0
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 1
    const nextExitedCount = 0
    const depositAmount = round(stakeAmount * ((100 + await manager.getFeePercent()) / 100), 10)    
    const deposit = await manager.connect(secondUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    /** Initiate next ready pool */
    const nextValidatorIndex = (await manager.getPendingPoolIds()).length + (await manager.getStakedPoolIds()).length
    await initiatePoolDepositHander({ manager, signer: dkg, index: nextValidatorIndex })

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, keeper })

    /** Fulfill functions request */
    if (ranUpkeep) {
        await fulfillFunctionsRequest({
            upkeep,
            keeper,
            nextActiveBalanceAmount,
            nextSweptRewardsAmount,
            nextSweptExitsAmount,
            nextDepositedCount,
            nextExitedCount
        })
    }

    return { manager, upkeep, owner, firstUser, secondUser, keeper, dkg }
}

/** Fixture to report increase of 0.105 in total rewards before fees */
export async function rewardsPostSecondUserDepositFixture() {
    const { manager, upkeep, owner, firstUser, secondUser, keeper, dkg } = await loadFixture(secondUserDepositFixture)

    const rewardsAmount = 0.105
    const nextActiveBalanceAmount = 32 + rewardsAmount
    const nextSweptRewardsAmount = 0
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 0
    const nextExitedCount = 0

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, keeper })

    /** Fulfill functions request */
    if (ranUpkeep) {
        await fulfillFunctionsRequest({ 
            upkeep,
            keeper,
            nextActiveBalanceAmount,
            nextSweptRewardsAmount,
            nextSweptExitsAmount,
            nextDepositedCount,
            nextExitedCount
        })
    }

    return { manager, upkeep, owner, firstUser, secondUser, keeper, dkg }
}

/** Fixture to sweep 0.105 to the manager */
export async function sweepPostSecondUserDepositFixture() {
    const { manager, upkeep, owner, firstUser, secondUser, keeper, dkg } = await loadFixture(secondUserDepositFixture)

    const sweptRewards = 0.105
    const sweep = await keeper.sendTransaction({ to: manager.address, value: ethers.utils.parseEther(sweptRewards.toString()) })
    await sweep.wait()

    const nextActiveBalanceAmount = 32
    const nextSweptRewardsAmount = sweptRewards
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 0
    const nextExitedCount = 0

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, keeper })

    /** Fulfill functions request */
    if (ranUpkeep) {
        await fulfillFunctionsRequest({ 
            upkeep,
            keeper,
            nextActiveBalanceAmount,
            nextSweptRewardsAmount,
            nextSweptExitsAmount,
            nextDepositedCount,
            nextExitedCount
        })
    }

    return { manager, upkeep, owner, firstUser, secondUser, keeper, dkg }
}

/** Fixture to stake 24 for the third user */
export async function thirdUserDepositFixture() {
    const { manager, upkeep, owner, firstUser, secondUser, keeper, dkg } = await loadFixture(sweepPostSecondUserDepositFixture)
    const [, , , thirdUser] = await ethers.getSigners()

    const stakeAmount = 24
    const nextActiveBalanceAmount = 64
    const nextSweptRewardsAmount = 0
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 1
    const nextExitedCount = 0
    const depositAmount = round(stakeAmount * ((100 + await manager.getFeePercent()) / 100), 10)    
    const deposit = await manager.connect(thirdUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    /** Initiate next ready pool */
    const nextValidatorIndex = (await manager.getPendingPoolIds()).length + (await manager.getStakedPoolIds()).length
    await initiatePoolDepositHander({ manager, signer: dkg, index: nextValidatorIndex })

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, keeper })

    /** Fulfill functions request */
    if (ranUpkeep) {
        await fulfillFunctionsRequest({ 
            upkeep,
            keeper,
            nextActiveBalanceAmount,
            nextSweptRewardsAmount,
            nextSweptExitsAmount,
            nextDepositedCount,
            nextExitedCount
        })
    }

    return { manager, upkeep, owner, firstUser, secondUser, thirdUser, keeper, dkg }
}

/** Fixture to report increase of 0.21 in total rewards before fees */
export async function rewardsPostThirdUserDepositFixture() {
    const { manager, upkeep, owner, firstUser, secondUser, thirdUser, keeper, dkg } = await loadFixture(thirdUserDepositFixture)

    const rewardsAmount = 0.21
    const nextActiveBalanceAmount = 64 + rewardsAmount
    const nextSweptRewardsAmount = 0
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 0
    const nextExitedCount = 0

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, keeper })

    /** Fulfill functions request */
    if (ranUpkeep) {
        await fulfillFunctionsRequest({ 
            upkeep,
            keeper,
            nextActiveBalanceAmount,
            nextSweptRewardsAmount,
            nextSweptExitsAmount,
            nextDepositedCount,
            nextExitedCount
        })
    }

    return { manager, upkeep, owner, firstUser, secondUser, thirdUser, keeper, dkg }
}

/** Fixture to sweep 0.21 to the manager */
export async function sweepPostThirdUserDepositFixture() {
    const { manager, upkeep, owner, firstUser, secondUser, thirdUser, keeper, dkg } = await loadFixture(rewardsPostThirdUserDepositFixture)

    const sweptRewards = 0.21
    const sweep = await keeper.sendTransaction({ to: manager.address, value: ethers.utils.parseEther(sweptRewards.toString()) })
    await sweep.wait()

    const nextActiveBalanceAmount = 64
    const nextSweptRewardsAmount = sweptRewards
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 0
    const nextExitedCount = 0

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, keeper })

    /** Fulfill functions request */
    if (ranUpkeep) {
        await fulfillFunctionsRequest({ 
            upkeep,
            keeper,
            nextActiveBalanceAmount,
            nextSweptRewardsAmount,
            nextSweptExitsAmount,
            nextDepositedCount,
            nextExitedCount
        })
    }

    return { manager, upkeep, owner, firstUser, secondUser, thirdUser, keeper, dkg }
}

/** Fixture to partial withdraw 0.3 to the first user */
export async function firstUserPartialWithdrawalFixture() {
    const { manager, upkeep, firstUser, secondUser, thirdUser, keeper, dkg } = await loadFixture(sweepPostThirdUserDepositFixture)
    const openDeposits = await manager.getOpenDeposits()
    const withdraw = await manager.connect(firstUser).requestWithdrawal(openDeposits)
    await withdraw.wait()

    /** Run upkeep */
    await runUpkeep({ upkeep, keeper })

    return { manager, upkeep, firstUser, secondUser, thirdUser, keeper, dkg }
}

/** Fixture to stake 72 for the fourth user */
export async function fourthUserDepositFixture() {
    const { manager, upkeep, firstUser, secondUser, thirdUser, keeper, dkg } = await loadFixture(firstUserPartialWithdrawalFixture)
    const [, , , , fourthUser] = await ethers.getSigners()

    const stakeAmount = 72
    const nextActiveBalanceAmount = 128
    const nextSweptRewardsAmount = 0
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 2
    const nextExitedCount = 0
    const depositAmount = round(stakeAmount * ((100 + await manager.getFeePercent()) / 100), 10)
    const deposit = await manager.connect(fourthUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
    await deposit.wait()

    /** Initiate next ready pools (2) */
    for (let i = 0; i < 2; i++) {
        const nextValidatorIndex = (await manager.getPendingPoolIds()).length + (await manager.getStakedPoolIds()).length
        await initiatePoolDepositHander({ manager, signer: dkg, index: nextValidatorIndex })
    }

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, keeper })

    /** Fulfill functions request */
    if (ranUpkeep) {
        await fulfillFunctionsRequest({ 
            upkeep,
            keeper,
            nextActiveBalanceAmount,
            nextSweptRewardsAmount,
            nextSweptExitsAmount,
            nextDepositedCount,
            nextExitedCount
        })
    }

    return { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, dkg }
}

/** Fixture to simulate a validator stake penalty that decreases the active balance */
export async function activeBalanceLossFixture() {
    const { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, dkg } = await loadFixture(fourthUserDepositFixture)

    const nextActiveBalanceAmount = 126
    const nextSweptRewardsAmount = 0
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 0
    const nextExitedCount = 0

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, keeper })

    /** Fulfill functions request */
    if (ranUpkeep) {
        await fulfillFunctionsRequest({ 
            upkeep,
            keeper,
            nextActiveBalanceAmount,
            nextSweptRewardsAmount,
            nextSweptExitsAmount,
            nextDepositedCount,
            nextExitedCount
        })
    }

    return { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, dkg }
}

/** Fixture to simulate a validator reward that brings the active balance back to expected */
export async function activeBalanceRecoveryFixture() {
    const { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, dkg } = await loadFixture(activeBalanceLossFixture)

    let nextActiveBalanceAmount = 126
    const nextSweptRewardsAmount = 0
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 0
    const nextExitedCount = 0

    /** Simulate two distinct reported gains */
    for (let i = 0; i < 2; i++) {
        nextActiveBalanceAmount += 1

        /** Run upkeep */
        const ranUpkeep = await runUpkeep({ upkeep, keeper })

        /** Fulfill functions request */
        if (ranUpkeep) {
            await fulfillFunctionsRequest({ 
                upkeep,
                keeper,
                nextActiveBalanceAmount,
                nextSweptRewardsAmount,
                nextSweptExitsAmount,
                nextDepositedCount,
                nextExitedCount
            })
        }
    }

    return { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, dkg }
}

// /** Fixture to full withdraw ~24.07 */
// export async function thirdUserFullWithdrawalFixture() {
//     const { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, dkg } = await loadFixture(fourthUserDepositFixture)

//     const thirdStake = await manager.getUserStake(thirdUser.address)
//     const withdraw = await manager.connect(thirdUser).requestWithdrawal(thirdStake)
//     await withdraw.wait()

//     /** Run upkeep */
//     await runUpkeep({ upkeep, keeper })

//     return { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, dkg }
// }

/** Fixture to simulate stakes and rewards */
export async function simulationFixture() {
    const { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, dkg } = await loadFixture(activeBalanceRecoveryFixture)

    const rewardsPerValidator = 0.105
    let nextActiveBalanceAmount = 128
    let totalRewards = 0

    for (let i = 0; i < 5; i++) {
        const validatorCount = (await manager.getValidatorPublicKeys())?.length
        if (validatorCount) {
            const rewardsAmount = rewardsPerValidator * validatorCount
            totalRewards += round(rewardsAmount, 10)
            nextActiveBalanceAmount = round(nextActiveBalanceAmount + rewardsAmount, 10)
            const nextSweptRewardsAmount = 0
            const nextSweptExitsAmount = 0
            const nextDepositedCount = 0
            const nextExitedCount = 0

            /** Run upkeep */
            const ranUpkeep = await runUpkeep({ upkeep, keeper })

            /** Fulfill functions request */
            if (ranUpkeep) {
                await fulfillFunctionsRequest({ 
                    upkeep,
                    keeper,
                    nextActiveBalanceAmount,
                    nextSweptRewardsAmount,
                    nextSweptExitsAmount,
                    nextDepositedCount,
                    nextExitedCount
                })
            }
        }
    }

    const sweptRewards = totalRewards
    const sweep = await keeper.sendTransaction({ to: manager.address, value: ethers.utils.parseEther(sweptRewards.toString()) })
    await sweep.wait()

    nextActiveBalanceAmount = 128
    const nextSweptRewardsAmount = sweptRewards
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 0
    const nextExitedCount = 0

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, keeper })

    /** Fulfill functions request */
    if (ranUpkeep) {
        await fulfillFunctionsRequest({ 
            upkeep,
            keeper,
            nextActiveBalanceAmount,
            nextSweptRewardsAmount,
            nextSweptExitsAmount,
            nextDepositedCount,
            nextExitedCount
        })
    }

    return { manager, upkeep, firstUser, secondUser, thirdUser, fourthUser, keeper, dkg }
}