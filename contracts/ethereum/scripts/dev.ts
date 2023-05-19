import { deployContract } from '@casimir/ethereum/helpers/deploy'
import { ContractConfig, DeploymentConfig } from '@casimir/types'
import { CasimirUpkeep, CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { ethers } from 'hardhat'
import { fulfillFunctionsRequest, runUpkeep } from '@casimir/ethereum/helpers/upkeep'
import { round } from '@casimir/ethereum/helpers/math'
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
    const upkeep = await ethers.getContractAt('CasimirUpkeep', await manager.getUpkeepAddress() as string) as CasimirUpkeep

    /** Stake 160 from the fourth user */
    setTimeout(async () => {
        const stakeAmount = 160
        const feePercent = await manager.getFeePercent()
        const depositAmount = stakeAmount * ((100 + feePercent) / 100)
        const stake = await manager.connect(fourthUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
        await stake?.wait()
    }, 1000)

    /** Perform upkeep and fulfill dkg answer after each pool is initiated by the local oracle */
    for await (const event of on(manager as unknown as EventEmitter, 'PoolDepositInitiated')) {
        const [id, details] = event
        console.log(`Pool ${id} initiated at block number ${details.blockNumber}`)
    }

    /** Simulate rewards per staked validator */
    const blocksPerReward = 50
    const rewardPerValidator = 0.105
    let lastRewardBlock = await ethers.provider.getBlockNumber()
    for await (const block of on(ethers.provider as unknown as EventEmitter, 'block')) {
        if (block - blocksPerReward === lastRewardBlock) {
            lastRewardBlock = block
            const validatorCount = await manager.getValidatorPublicKeys()
            if (validatorCount?.length) {
                console.log(`Rewarding ${validatorCount.length} validators ${rewardPerValidator} each`)
                const rewardAmount = rewardPerValidator * validatorCount.length

                /** Perform upkeep */
                const ranUpkeepBefore = await runUpkeep({ upkeep, keeper })

                /** Fulfill functions request */
                if (ranUpkeepBefore) {
                    const nextActiveBalanceAmount = round(
                        parseFloat(
                            ethers.utils.formatEther(
                                (await manager.getActiveStake()).add((await manager.getPendingPoolIds()).length * 32)
                            )
                        ) + rewardAmount
                    )
                    const nextSweptRewardsAmount = 0
                    const nextSweptExitsAmount = 0
                    const nextDepositedCount = (await manager.getPendingPoolIds()).length
                    const nextExitedCount = 0

                    console.log('Fulfilling before sweep:')
                    console.log('nextActiveBalanceAmount', nextActiveBalanceAmount)
                    console.log('nextSweptRewardsAmount', nextSweptRewardsAmount)
                    console.log('nextSweptExitsAmount', nextSweptExitsAmount)
                    console.log('nextDepositedCount', nextDepositedCount)
                    console.log('nextExitedCount', nextExitedCount)

                    await fulfillFunctionsRequest({ upkeep, keeper, nextActiveBalanceAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
                }

                /** Sweep rewards before next upkeep (balance will increment silently) */
                const sweep = await keeper.sendTransaction({ to: manager.address, value: ethers.utils.parseEther(rewardAmount.toString()) })
                await sweep.wait()

                /** Perform upkeep */
                const ranUpkeepAfter = await runUpkeep({ upkeep, keeper })

                /** Fulfill functions request */
                if (ranUpkeepAfter) {
                    const nextActiveBalanceAmount = round(
                        parseFloat(
                            ethers.utils.formatEther(
                                (await manager.getActiveStake()).add((await manager.getPendingPoolIds()).length * 32)
                            )
                        ) - rewardAmount
                    )
                    const nextSweptRewardsAmount = rewardAmount
                    const nextSweptExitsAmount = 0
                    const nextDepositedCount = (await manager.getPendingPoolIds()).length
                    const nextExitedCount = 0

                    console.log('Fulfilling after sweep:')
                    console.log('nextActiveBalanceAmount', nextActiveBalanceAmount)
                    console.log('nextSweptRewardsAmount', nextSweptRewardsAmount)
                    console.log('nextSweptExitsAmount', nextSweptExitsAmount)
                    console.log('nextDepositedCount', nextDepositedCount)
                    console.log('nextExitedCount', nextExitedCount)

                    await fulfillFunctionsRequest({ upkeep, keeper, nextActiveBalanceAmount, nextSweptRewardsAmount, nextSweptExitsAmount, nextDepositedCount, nextExitedCount })
                }

            }
        }
    }
}()