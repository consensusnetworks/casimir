import { deployContract } from '@casimir/hardhat-helpers'
import { ContractConfig, DeploymentConfig, Validator } from '@casimir/types'
import { validatorStore } from '@casimir/data'

void async function () {
    let ssvManager
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
                wethTokenAddress: process.env.WETH_TOKEN_ADDRESS
            },
            options: {},
            proxy: false
        }
    }

    for (const name in config) {
        console.log(`Deploying ${name} contract...`)
        const { args, options, proxy } = config[name as keyof typeof config] as ContractConfig

        // Update SSVManager args with MockFeed address
        if (name === 'SSVManager' && config.MockFeed) {
            args.linkFeedAddress = config.MockFeed.address
        }

        const contract = await deployContract(name, proxy, args, options)
        const { address } = contract

        // Semi-colon needed
        console.log(`${name} contract deployed to ${address}`);

        // Save contract address for next loop
        (config[name as keyof DeploymentConfig] as ContractConfig).address = address

        // Save SSV manager for export
        if (name === 'SSVManager') ssvManager = contract
    }

    if (process.env.HARDHAT_NETWORK) {
        console.log('HARDHAT_NETWORK', process.env.HARDHAT_NETWORK)
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
            const registration = await ssvManager?.addValidator(
                depositDataRoot,
                publicKey,
                operatorIds,
                sharesEncrypted,
                sharesPublicKeys,
                signature,
                withdrawalCredentials
            )
            await registration.wait()
        }
    }
}()