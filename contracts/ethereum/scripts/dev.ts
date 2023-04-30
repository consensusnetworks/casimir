import { deployContract } from '@casimir/hardhat'
import { ContractConfig, DeploymentConfig, Validator } from '@casimir/types'
import { validatorStore } from '@casimir/data'
import { CasimirAutomation, CasimirManager, MockFunctionsOracle } from '../build/artifacts/types'
import { ethers } from 'hardhat'
import { fulfillOracleAnswer, runUpkeep } from '../test/helpers/automation'

void async function () {
    let manager: CasimirManager | undefined
    let mockFunctionsOracle: MockFunctionsOracle | undefined
    const [, , , , , chainlink] = await ethers.getSigners()
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
        if (name == 'CasimirManager') manager = contract as CasimirManager

        // Save mock functions oracle for export
        if (name == 'MockFunctionsOracle') mockFunctionsOracle = contract as MockFunctionsOracle
    }

    const automationAddress = await manager?.getAutomationAddress() as string
    const automation = await ethers.getContractAt('CasimirAutomation', automationAddress) as CasimirAutomation

    const validators = Object.keys(validatorStore).map((key) => validatorStore[key]) as Validator[]
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

                const rewardAmount = (rewardPerValidator * stakedValidatorPublicKeys.length).toString()

                // const nextActiveStakeAmount = ethers.utils.formatEther(await manager?.getActiveStake() as ) + parseFloat(rewardAmount)
                // const nextSweptRewardsAmount = 0.2
                // const nextSweptExitsAmount = 0

                /** Perform upkeep */
                const ranUpkeepBefore = await runUpkeep(automation, chainlink)

                /** Fulfill oracle answer */
                if (ranUpkeepBefore) {
                    // await fulfillOracleAnswer(automation, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount)
                }

                /** Sweep rewards before next upkeep (balance will increment silently) */
                // const sweep = await chainlink.sendTransaction({ to: manager?.address, value: ethers.utils.parseEther(nextSweptRewardsAmount.toString()) })
                // await sweep.wait()

                /** Perform upkeep */
                const ranUpkeepAfter = await runUpkeep(automation, chainlink)

                /** Fulfill oracle answer */
                if (ranUpkeepAfter) {
                    // await fulfillOracleAnswer(automation, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount)
                }
                
            }
        }
    })

    /** Perform upkeep and fulfill oracle answer after each pool is staked */
    manager?.on('PoolStaked(uint32)', async () => {

        /** Perform upkeep */
        const ranUpkeep = await runUpkeep(automation, chainlink)

        /** Fulfill oracle answer */
        if (ranUpkeep) {
            // const nextActiveStakeAmount = 
            // const nextSweptRewardsAmount = 
            // const nextSweptExitsAmount = 
            // await fulfillOracleAnswer(automation, chainlink, nextActiveStakeAmount, nextSweptRewardsAmount, nextSweptExitsAmount)
        }
    })
}()