import { deployContract } from '@casimir/hardhat-helpers'
import { ContractConfig, DeploymentConfig } from '@casimir/types'

void async function () {
    const mockChainlink = process.env.MOCK_CHAINLINK === 'true'
    let config: DeploymentConfig = {
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

    if (mockChainlink) {
        const mockChainlinkConfig = {
            MockFeed: {
                address: '',
                args: {
                    linkTokenAddress: process.env.LINK_TOKEN_ADDRESS
                },
                options: {},
                proxy: false
            }
        }
        config = {
            // Deploy Chainlink contracts first
            ...mockChainlinkConfig,
            ...config
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
    }
}()