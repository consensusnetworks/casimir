import { deployContract } from '@casimir/hardhat-helpers'
import { SSV } from '@casimir/keys'
import { ContractConfig, DeploymentConfig } from '@casimir/types'

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
        const dkgServiceUrl = 'http://0.0.0.0:8000'
        const groups = [[1, 2, 3, 4], [1, 2, 3, 4]]
        const ssv = new SSV({ dkgServiceUrl })
        const validators = []
        for (const group of groups) {
            const validator = await ssv.createValidator({ operatorIds: group })
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
            validators.push(validator)

            /** Wait for next ceremony */
            if (group !== groups[groups.length - 1]) {
                await new Promise(resolve => setTimeout(resolve, 5000))
            }
        }
    }
}()