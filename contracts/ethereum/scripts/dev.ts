import { deployContract } from '@casimir/ethereum/helpers/deploy'
import { ContractConfig, DeploymentConfig } from '@casimir/types'
import { CasimirUpkeep, CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { ethers } from 'hardhat'
import { fulfillReportRequest, runUpkeep } from '@casimir/ethereum/helpers/upkeep'
import { round } from '@casimir/ethereum/helpers/math'
import EventEmitter, { on } from 'events'
import { time, setBalance } from '@nomicfoundation/hardhat-network-helpers'

void async function () {
    const [, , , , fourthUser, keeper, oracle] = await ethers.getSigners()

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
        const depositAmount = 160 * ((100 + await manager.getFeePercent()) / 100)
        const stake = await manager.connect(fourthUser).depositStake({ value: ethers.utils.parseEther(depositAmount.toString()) })
        await stake?.wait()
    }, 1000)

    /** Simulate rewards per staked validator */
    let requestId = 0
    const blocksPerReward = 50
    const rewardPerValidator = 0.105
    let lastRewardBlock = await ethers.provider.getBlockNumber()
    for await (const block of on(ethers.provider as unknown as EventEmitter, 'block')) {
        if (block - blocksPerReward === lastRewardBlock) {
            lastRewardBlock = block
            const depositedPoolCount = await manager.getDepositedPoolCount()
            if (depositedPoolCount) {
                console.log(`Rewarding ${depositedPoolCount} validators ${rewardPerValidator} each`)
                await time.increase(time.duration.days(1))

                await runUpkeep({ upkeep, keeper })
                
                const rewardAmount = rewardPerValidator * depositedPoolCount.toNumber()
                let nextActiveBalance = round(
                    parseFloat(
                        ethers.utils.formatEther(
                            (await manager.getLatestActiveBalance()).add((await manager.getPendingPoolIds()).length * 32)
                        )
                    ) + rewardAmount
                )
                
                let nextActivatedDeposits = (await manager.getPendingPoolIds()).length
                let nextValues = {
                    activeBalance: nextActiveBalance,
                    activatedDeposits: nextActivatedDeposits,
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

                const currentBalance = await ethers.provider.getBalance(manager.address)
                const nextBalance = currentBalance.add(ethers.utils.parseEther(rewardAmount.toString()))
                await setBalance(manager.address, nextBalance)

                await time.increase(time.duration.days(1))

                await runUpkeep({ upkeep, keeper })

                nextActiveBalance = round(
                    parseFloat(
                        ethers.utils.formatEther(
                            (await manager.getLatestActiveBalance()).add((await manager.getPendingPoolIds()).length * 32)
                        )
                    ) - rewardAmount
                )
                nextActivatedDeposits = (await manager.getPendingPoolIds()).length
                nextValues = {
                    activeBalance: nextActiveBalance,
                    activatedDeposits: nextActivatedDeposits,
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
    }
}()