import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { deployContract } from '@casimir/ethereum/helpers/deploy'
import { CasimirManager, CasimirUpkeep, MockFunctionsOracle } from '@casimir/ethereum/build/artifacts/types'
import { fulfillOracleAnswer, runUpkeep } from '@casimir/ethereum/helpers/upkeep'
import { ContractConfig, DeploymentConfig, Validator } from '@casimir/types'
import { validatorStore } from '@casimir/data'

/** Simulation amount of reward to distribute per staked validator */
const rewardPerValidator = 0.1

/** Fixture to deploy SSV manager contract */
export async function deploymentFixture() {
    let manager: CasimirManager | undefined
    let mockFunctionsOracle: MockFunctionsOracle | undefined
    const [owner, , , , , chainlink] = await ethers.getSigners()
    let config: DeploymentConfig = {
        CasimirManager: {
            address: '',
            args: {
                beaconDepositAddress: process.env.BEACON_DEPOSIT_ADDRESS,
                linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
                oracleAddress: process.env.ORACLE_ADDRESS,
                oracleSubId: process.env.ORACLE_SUB_ID,
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
            (config[name as keyof typeof config] as ContractConfig).args.oracleAddress = config.MockFunctionsOracle?.address
        }

        const { args, options, proxy } = config[name as keyof typeof config] as ContractConfig

        const contract = await deployContract(name, proxy, args, options)
        const { address } = contract

        // Semi-colon needed
        console.log(`${name} contract deployed to ${address}`);

        // Save contract address for next loop
        (config[name as keyof DeploymentConfig] as ContractConfig).address = address

        // Save SSV manager for export
        if (name === 'CasimirManager') manager = contract as CasimirManager

        // Save mock Functions oracle for export
        if (name === 'MockFunctionsOracle') mockFunctionsOracle = contract as MockFunctionsOracle
    }

    const upkeepAddress = await manager?.getUpkeepAddress() as string
    const upkeep = await ethers.getContractAt('CasimirUpkeep', upkeepAddress) as CasimirUpkeep

    return { manager: manager as CasimirManager, upkeep: upkeep as CasimirUpkeep, mockFunctionsOracle, owner, chainlink }
}

/** Fixture to add validators */
export async function registerValidatorsFixture() {
    const { manager, upkeep, mockFunctionsOracle, owner, chainlink } = await loadFixture(deploymentFixture)

    const validators = Object.keys(validatorStore).map((key) => validatorStore[key as keyof typeof validatorStore]) as Validator[]
    for (const validator of validators) {
        const {
            depositDataRoot,
            publicKey,
            operatorIds,
            sharesEncrypted,
            sharesPublicKeys,
            signature,
            withdrawalCredentials
        } = validator
        const registerValidator = await manager.registerValidator(
            depositDataRoot,
            publicKey,
            operatorIds,
            sharesEncrypted,
            sharesPublicKeys,
            signature,
            withdrawalCredentials
        )
        await registerValidator.wait()
    }
    return { manager, upkeep, mockFunctionsOracle, owner, chainlink, validators }
}

/** Fixture to stake 16 ETH for the first user */
export async function firstUserDepositFixture() {
    const { manager, upkeep, mockFunctionsOracle, owner, chainlink } = await loadFixture(registerValidatorsFixture)
    const [, firstUser] = await ethers.getSigners()

    const stakeAmount = 16

    const fees = { ...await manager.getFees() }
    const feePercent = fees.LINK + fees.SSV
    const depositAmount = stakeAmount * ((100 + feePercent) / 100)
    const value = ethers.utils.parseEther(depositAmount.toString())
    const deposit = await manager.connect(firstUser).depositStake({ value })
    await deposit.wait()

    /** Run upkeep */
    await runUpkeep({ upkeep, chainlink })

    return { manager, upkeep, mockFunctionsOracle, owner, chainlink, firstUser }
}

/** Fixture to stake 24 ETH for the second user */
export async function secondUserDepositFixture() {
    const { manager, upkeep, mockFunctionsOracle, owner, chainlink, firstUser } = await loadFixture(firstUserDepositFixture)
    const [, , secondUser] = await ethers.getSigners()

    const stakeAmount = 24
    const nextActiveStakeAmount = 32
    const nextSweptRewardsAmount = 0
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 1
    const nextExitedCount = 0

    const fees = { ...await manager.getFees() }
    const feePercent = fees.LINK + fees.SSV
    const depositAmount = stakeAmount * ((100 + feePercent) / 100)
    const value = ethers.utils.parseEther(depositAmount.toString())
    const deposit = await manager.connect(secondUser).depositStake({ value })
    await deposit.wait()

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, chainlink })

    /** Fulfill oracle answer */
    if (ranUpkeep) {
        await fulfillOracleAnswer({ upkeep, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
    }

    return { manager, upkeep, mockFunctionsOracle, owner, chainlink, firstUser, secondUser }
}

/** Fixture to reward 0.1 ETH in total to the first and second user */
export async function rewardPostSecondUserDepositFixture() {
    const { manager, upkeep, mockFunctionsOracle, owner, chainlink, firstUser, secondUser } = await loadFixture(secondUserDepositFixture)

    const rewardAmount = 0.1
    const nextActiveStakeAmount = 32 + rewardAmount
    const nextSweptRewardsAmount = 0
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 0
    const nextExitedCount = 0

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, chainlink })

    /** Fulfill oracle answer */
    if (ranUpkeep) {
        await fulfillOracleAnswer({ upkeep, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
    }

    return { manager, upkeep, mockFunctionsOracle, owner, chainlink, firstUser, secondUser }
}

/** Fixture to sweep 0.1 ETH to the manager */
export async function sweepPostSecondUserDepositFixture() {
    const { manager, upkeep, mockFunctionsOracle, owner, chainlink, firstUser, secondUser } = await loadFixture(secondUserDepositFixture)

    const sweptRewards = 0.1
    const sweep = await chainlink.sendTransaction({ to: manager?.address, value: ethers.utils.parseEther(sweptRewards.toString()) })
    await sweep.wait()

    const nextActiveStakeAmount = 32
    const nextSweptRewardsAmount = sweptRewards
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 0
    const nextExitedCount = 0

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, chainlink })

    /** Fulfill oracle answer */
    if (ranUpkeep) {
        await fulfillOracleAnswer({ upkeep, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
    }

    return { manager, upkeep, mockFunctionsOracle, owner, chainlink, firstUser, secondUser }
}

/** Fixture to stake 24 ETH for the third user */
export async function thirdUserDepositFixture() {
    const { manager, upkeep, mockFunctionsOracle, owner, chainlink, firstUser, secondUser } = await loadFixture(sweepPostSecondUserDepositFixture)
    const [, , , thirdUser] = await ethers.getSigners()

    const stakeAmount = 24
    const nextActiveStakeAmount = 64
    const nextSweptRewardsAmount = 0
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 1
    const nextExitedCount = 0

    const fees = { ...await manager.getFees() }
    const feePercent = fees.LINK + fees.SSV
    const depositAmount = stakeAmount * ((100 + feePercent) / 100)
    const value = ethers.utils.parseEther(depositAmount.toString())
    const deposit = await manager.connect(thirdUser).depositStake({ value })
    await deposit.wait()

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, chainlink })

    /** Fulfill oracle answer */
    if (ranUpkeep) {
        await fulfillOracleAnswer({ upkeep, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
    }

    return { manager, upkeep, mockFunctionsOracle, owner, chainlink, firstUser, secondUser, thirdUser }
}

/** Fixture to reward 0.2 ETH in total to the first, second, and third user */
export async function rewardPostThirdUserDepositFixture() {
    const { manager, upkeep, mockFunctionsOracle, owner, chainlink, firstUser, secondUser, thirdUser } = await loadFixture(thirdUserDepositFixture)

    const rewardAmount = 0.2
    const nextActiveStakeAmount = 64 + rewardAmount
    const nextSweptRewardsAmount = 0
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 0
    const nextExitedCount = 0

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, chainlink })

    /** Fulfill oracle answer */
    if (ranUpkeep) {
        await fulfillOracleAnswer({ upkeep, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
    }

    return { manager, upkeep, mockFunctionsOracle, owner, chainlink, firstUser, secondUser, thirdUser }
}

/** Fixture to sweep 0.2 ETH to the manager */
export async function sweepPostThirdUserDepositFixture() {
    const { manager, upkeep, mockFunctionsOracle, owner, chainlink, firstUser, secondUser, thirdUser } = await loadFixture(rewardPostThirdUserDepositFixture)

    const sweptRewards = 0.2
    const sweep = await chainlink.sendTransaction({ to: manager?.address, value: ethers.utils.parseEther(sweptRewards.toString()) })
    await sweep.wait()

    const nextActiveStakeAmount = 64
    const nextSweptRewardsAmount = sweptRewards
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 0
    const nextExitedCount = 0

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, chainlink })

    /** Fulfill oracle answer */
    if (ranUpkeep) {
        await fulfillOracleAnswer({ upkeep, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
    }

    return { manager, upkeep, mockFunctionsOracle, owner, chainlink, firstUser, secondUser, thirdUser }
}

/** Fixture to withdraw 0.3 to the first user */
export async function firstUserPartialWithdrawalFixture() {
    const { manager, upkeep, mockFunctionsOracle, chainlink, firstUser, secondUser, thirdUser } = await loadFixture(sweepPostThirdUserDepositFixture)
    const openDeposits = await manager?.getOpenDeposits()
    const withdraw = await manager.connect(firstUser).requestWithdrawal(openDeposits)
    await withdraw.wait()

    /** Run upkeep */
    await runUpkeep({ upkeep, chainlink })

    return { manager, upkeep, mockFunctionsOracle, chainlink, firstUser, secondUser, thirdUser }
}

/** Fixture to stake 72 for the fourth user */
export async function fourthUserDepositFixture() {
    const { manager, upkeep, mockFunctionsOracle, chainlink, firstUser, secondUser, thirdUser } = await loadFixture(firstUserPartialWithdrawalFixture)
    const [, , , , fourthUser] = await ethers.getSigners()

    const stakeAmount = 72
    const nextActiveStakeAmount = 128
    const nextSweptRewardsAmount = 0
    const nextSweptExitsAmount = 0
    const nextDepositedCount = 2
    const nextExitedCount = 0

    const fees = { ...await manager.getFees() }
    const feePercent = fees.LINK + fees.SSV
    const depositAmount = stakeAmount * ((100 + feePercent) / 100)
    const value = ethers.utils.parseEther(depositAmount.toString())
    const deposit = await manager.connect(fourthUser).depositStake({ value })
    await deposit.wait()

    /** Run upkeep */
    const ranUpkeep = await runUpkeep({ upkeep, chainlink })

    /** Fulfill oracle answer */
    if (ranUpkeep) {
        await fulfillOracleAnswer({ upkeep, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
    }

    return { manager, upkeep, mockFunctionsOracle, chainlink, firstUser, secondUser, thirdUser, fourthUser }
}

/** Fixture to simulate stakes and rewards */
export async function simulationFixture() {
    const { manager, upkeep, mockFunctionsOracle, chainlink, firstUser, secondUser, thirdUser, fourthUser } = await loadFixture(fourthUserDepositFixture)

    let nextActiveStakeAmount = 128

    for (let i = 0; i < 5; i++) {
        const stakedValidatorCount = (await manager?.getStakedValidatorPublicKeys())?.length
        if (stakedValidatorCount) {
            const rewardAmount = rewardPerValidator * stakedValidatorCount
            nextActiveStakeAmount = Math.round((nextActiveStakeAmount + rewardAmount) * 10) / 10 // Fixes weird rounding error
            const nextSweptRewardsAmount = 0
            const nextSweptExitsAmount = 0
            const nextDepositedCount = 0
            const nextExitedCount = 0

            /** Run upkeep */
            const ranUpkeep = await runUpkeep({ upkeep, chainlink })

            /** Fulfill oracle answer */
            if (ranUpkeep) {
                await fulfillOracleAnswer({ upkeep, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
            }
        }
    }
    return { manager, upkeep, mockFunctionsOracle, chainlink, firstUser, secondUser, thirdUser, fourthUser }
}