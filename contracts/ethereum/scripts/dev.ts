import { deployContract } from '@casimir/hardhat'
import { ContractConfig, DeploymentConfig, Validator } from '@casimir/types'
import { validatorStore } from '@casimir/data'
import { SSVManager } from '../build/artifacts/types'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { simulationFixture } from '../test/fixtures/shared'

void async function () {
    const classic = process.env.CLASSIC === 'true'
    const simulation = process.env.SIMULATION === 'true'
    let ssvManager: SSVManager | undefined
    const [ , , , , distributor] = await ethers.getSigners()
    const config: DeploymentConfig = {
        SSVManager: {
            address: '',
            args: {
                beaconDepositAddress: process.env.BEACON_DEPOSIT_ADDRESS,
                linkFeedAddress: process.env.LINK_FEED_ADDRESS,
                linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
                ssvNetworkAddress: process.env.SSV_NETWORK_ADDRESS,
                ssvTokenAddress: process.env.SSV_TOKEN_ADDRESS,
                swapRouterAddress: process.env.SWAP_ROUTER_ADDRESS,
                wethTokenAddress: process.env.WETH_TOKEN_ADDRESS,
                classicMode: classic,
            },
            options: {},
            proxy: false
        }
    }

    for (const name in config) {
        console.log(`Deploying ${name} contract...`)
        const { args, options, proxy } = config[name as keyof typeof config] as ContractConfig

        const contract = await deployContract(name, proxy, args, options)
        const { address } = contract

        // Semi-colon needed
        console.log(`${name} contract deployed to ${address}`);

        // Save contract address for next loop
        (config[name as keyof DeploymentConfig] as ContractConfig).address = address

        // Save SSV manager for export
        if (name === 'SSVManager') ssvManager = contract as SSVManager
    }

    const validators = Object.keys(validatorStore).map((key) => validatorStore[key]).slice(0, 2) as Validator[]
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
        const registration = await ssvManager?.addValidator(
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

    /** Load simulation fixture */
    if (simulation) {
        await loadFixture(simulationFixture)
    }

    /** Distribute rewards every ${blocksPerReward} blocks */
    const blocksPerReward = 1
    let lastRewardBlock = await ethers.provider.getBlockNumber()
    ethers.provider.on('block', async (block) => {
        if (block - blocksPerReward === lastRewardBlock) {
            lastRewardBlock = block
            const activeValidatorPublicKeys = await ssvManager?.getStakedValidatorPublicKeys()
            if (activeValidatorPublicKeys?.length) {
                console.log(`Distributing rewards from ${activeValidatorPublicKeys.length} active validators...`)
                const rewardAmount = (0.1 * activeValidatorPublicKeys.length).toString()
                const reward = await distributor.sendTransaction({ to: ssvManager?.address, value: ethers.utils.parseEther(rewardAmount) })
                await reward.wait()
            }
        }
    })
}()