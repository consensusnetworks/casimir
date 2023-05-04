import { deployContract } from '@casimir/ethereum/helpers/deploy'
import { ContractConfig, DeploymentConfig, Validator } from '@casimir/types'
import { validatorStore } from '@casimir/data'
import { CasimirUpkeep, CasimirManager, MockFunctionsOracle } from '@casimir/ethereum/build/artifacts/types'
import { ethers } from 'hardhat'
import { fulfillOracleAnswer, runUpkeep } from '@casimir/ethereum/helpers/upkeep'

void async function () {
    const [, , , , fourthUser, chainlink] = await ethers.getSigners()
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
    }

    const manager = await ethers.getContractAt('CasimirManager', config.CasimirManager.address as string) as CasimirManager
    const upkeep = await ethers.getContractAt('CasimirUpkeep', await manager.getUpkeepAddress() as string) as CasimirUpkeep

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
        const registration = await manager?.registerValidator(
            depositDataRoot,
            publicKey,
            operatorIds,
            sharesEncrypted,
            sharesPublicKeys,
            signature,
            withdrawalCredentials
        )
        await registration?.wait()
    }

    /** Distribute rewards every ${blocksPerReward} blocks */
    const blocksPerReward = 10

    /** Simulation amount of reward to distribute per staked validator */
    const rewardPerValidator = 0.1

    let lastRewardBlock = await ethers.provider.getBlockNumber()
    ethers.provider.on('block', async (block) => {
        if (block - blocksPerReward === lastRewardBlock) {
            lastRewardBlock = block
            const stakedValidatorPublicKeys = await manager?.getStakedValidatorPublicKeys()
            if (stakedValidatorPublicKeys?.length) {

                const rewardAmount = rewardPerValidator * stakedValidatorPublicKeys.length

                /** Perform upkeep */
                const ranUpkeepBefore = await runUpkeep({ upkeep, chainlink })

                /** Fulfill oracle answer */
                if (ranUpkeepBefore) {
                    const nextActiveStakeAmount = Math.round((parseFloat(ethers.utils.formatEther(await manager.getActiveStake())) + rewardAmount) * 10) / 10
                    const nextSweptRewardsAmount = 0
                    const nextSweptExitsAmount = 0
                    const nextDepositedCount = 0
                    const nextExitedCount = 0
                    await fulfillOracleAnswer({ upkeep, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
                }

                /** Sweep rewards before next upkeep (balance will increment silently) */
                const sweep = await chainlink.sendTransaction({ to: manager?.address, value: ethers.utils.parseEther(rewardAmount.toString()) })
                await sweep.wait()

                /** Perform upkeep */
                const ranUpkeepAfter = await runUpkeep({ upkeep, chainlink })

                /** Fulfill oracle answer */
                if (ranUpkeepAfter) {
                    const nextActiveStakeAmount = Math.round((parseFloat(ethers.utils.formatEther(await manager.getActiveStake())) - rewardAmount) * 10) / 10
                    const nextSweptRewardsAmount = rewardAmount
                    const nextSweptExitsAmount = 0
                    const nextDepositedCount = 0
                    const nextExitedCount = 0
                    await fulfillOracleAnswer({ upkeep, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
                }
                
            }
        }
    })

    /** Perform upkeep and fulfill oracle answer after each pool is filled */
    const poolFilledFilter = {
        address: manager.address,
        topics: [
          ethers.utils.id('PoolFilled(address,uint32)'),
        ]
    }
    manager.on(poolFilledFilter, async () => {

        /** Perform upkeep */
        const ranUpkeep = await runUpkeep({ upkeep, chainlink })

        /** Fulfill oracle answer */
        if (ranUpkeep) {
            const nextActiveStakeAmount = parseFloat(ethers.utils.formatEther(await manager.getActiveStake())) + 32
            const nextSweptRewardsAmount = 0
            const nextSweptExitsAmount = 0
            const nextDepositedCount = 1
            const nextExitedCount = 0
            await fulfillOracleAnswer({ upkeep, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
        }
    })

    /** Stake 32 from the fourth user */
    const fourthUserStakeAmount = 32
    const fourthUserFees = { ...await (manager as CasimirManager).getFees() }
    const fourthUserFeePercent = fourthUserFees.LINK + fourthUserFees.SSV
    const fourthUserDepositAmount = fourthUserStakeAmount * ((100 + fourthUserFeePercent) / 100)
    const fourthUserStake = await manager?.connect(fourthUser).depositStake({ value: ethers.utils.parseEther(fourthUserDepositAmount.toString()) })
    await fourthUserStake?.wait()
}()