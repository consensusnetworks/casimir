import { deployContract } from '@casimir/ethereum/helpers/deploy'
import { ContractConfig, DeploymentConfig } from '@casimir/types'
import { CasimirUpkeep, CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { ethers } from 'hardhat'
import { fulfillFunctionsRequest, runUpkeep } from '@casimir/ethereum/helpers/upkeep'
import { initiatePoolDeposit } from '@casimir/ethereum/helpers/dkg'
import EventEmitter, { on } from 'events'

void async function () {
    const [, , , , fourthUser, keeper, dkg] = await ethers.getSigners()
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
            (config[name as keyof typeof config] as ContractConfig).args.dkgAddress = config.MockFunctionsOracle?.address
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
    
    /** Simulate rewards per staked validator */
    const blocksPerReward = 50
    const rewardPerValidator = 0.1
    let lastRewardBlock = await ethers.provider.getBlockNumber()
    ethers.provider.on('block', async (block) => {
        if (block - blocksPerReward === lastRewardBlock) {
            lastRewardBlock = block
            const stakedValidatorPublicKeys = await manager.getStakedValidatorPublicKeys()
            if (stakedValidatorPublicKeys?.length) {
                console.log(`Rewarding ${stakedValidatorPublicKeys.length} validators ${rewardPerValidator} each`)
                const rewardAmount = rewardPerValidator * stakedValidatorPublicKeys.length

                /** Perform upkeep */
                const ranUpkeepBefore = await runUpkeep({ upkeep, keeper })

                /** Fulfill functions request */
                if (ranUpkeepBefore) {
                    const nextActiveStakeAmount = Math.round((parseFloat(ethers.utils.formatEther(await manager.getActiveStake())) + rewardAmount) * 10) / 10
                    const nextSweptRewardsAmount = 0
                    const nextSweptExitsAmount = 0
                    const nextDepositedCount = 0
                    const nextExitedCount = 0
                    await fulfillFunctionsRequest({ upkeep, keeper, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
                }

                /** Sweep rewards before next upkeep (balance will increment silently) */
                const sweep = await keeper.sendTransaction({ to: manager.address, value: ethers.utils.parseEther(rewardAmount.toString()) })
                await sweep.wait()

                /** Perform upkeep */
                const ranUpkeepAfter = await runUpkeep({ upkeep, keeper })

                /** Fulfill functions request */
                if (ranUpkeepAfter) {
                    const nextActiveStakeAmount = Math.round((parseFloat(ethers.utils.formatEther(await manager.getActiveStake())) - rewardAmount) * 10) / 10
                    const nextSweptRewardsAmount = rewardAmount
                    const nextSweptExitsAmount = 0
                    const nextDepositedCount = 0
                    const nextExitedCount = 0
                    await fulfillFunctionsRequest({ upkeep, keeper, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
                }
                
            }
        }
    })

    /** Stake 64 from the fourth user */
    setTimeout(async () => {
        const fourthUserStakeAmount = 64
        const fourthUserFees = { ...await (manager as CasimirManager).getFees() }
        const fourthUserFeePercent = fourthUserFees.LINK + fourthUserFees.SSV
        const fourthUserDepositAmount = fourthUserStakeAmount * ((100 + fourthUserFeePercent) / 100)
        const fourthUserStake = await manager?.connect(fourthUser).depositStake({ value: ethers.utils.parseEther(fourthUserDepositAmount.toString()) })
        await fourthUserStake?.wait()
    }, 1000)

    /** Perform upkeep and fulfill dkg answer after each pool is filled */
    for await (const event of on(manager as unknown as EventEmitter, 'PoolReady')) {
        const [ id, details ] = event
        console.log(`Pool ${id} filled at block number ${details.blockNumber}`)

        const nextValidatorIndex = (await manager.getPendingPoolIds()).length + (await manager.getStakedPoolIds()).length
        await initiatePoolDeposit({ manager, dkg, index: nextValidatorIndex })

        /** Perform upkeep */
        const ranUpkeep = await runUpkeep({ upkeep, keeper })

        /** Fulfill functions request */
        if (ranUpkeep) {
            const nextActiveStakeAmount = parseFloat(ethers.utils.formatEther(await manager.getActiveStake())) + 32
            const nextSweptRewardsAmount = 0
            const nextSweptExitsAmount = 0
            const nextDepositedCount = 1
            const nextExitedCount = 0
            await fulfillFunctionsRequest({ upkeep, keeper, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
        }
    }
}()