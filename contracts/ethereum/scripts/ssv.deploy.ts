import { deployContract } from '@casimir/hardhat-helpers'
import { ContractConfig, SSVDeploymentConfig } from '@casimir/types'

void async function () {
    const mockChainlink = process.env.MOCK_CHAINLINK === 'true'
    let deploymentConfig: SSVDeploymentConfig = {
        SSVManager: {
            address: '',
            args: {
                linkOracleAddress: process.env.LINK_ORACLE_ADDRESS,
                swapRouterAddress: process.env.SWAP_ROUTER_ADDRESS,
                linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
                ssvTokenAddress: process.env.SSV_TOKEN_ADDRESS,
                wethTokenAddress: process.env.WETH_TOKEN_ADDRESS
            },
            options: {},
            proxy: false
        }
    }

    const chainlinkDeploymentConfig = {
        MockOracle: {
            address: '',
            args: {
                linkTokenAddress: process.env.LINK_TOKEN_ADDRESS
            },
            options: {},
            proxy: false
        }
    }

    if (mockChainlink) {
        deploymentConfig = {
            // Deploy Chainlink contracts first
            ...chainlinkDeploymentConfig,
            ...deploymentConfig
        }
    }

    for (const name in deploymentConfig) {
        console.log(`Deploying ${name} contract...`)
        const { args, options, proxy } = deploymentConfig[name as keyof typeof deploymentConfig] as ContractConfig

        // Update SSVManager args with MockOracle address
        if (name === 'SSVManager') {
            args.linkOracleAddress = deploymentConfig.MockOracle?.address
        }

        const contract = await deployContract(name, proxy, args, options)
        const { address } = contract

        // Semi-colon needed
        console.log(`${name} contract deployed to ${address}`);

        // Save contract address for next loop
        (deploymentConfig[name as keyof SSVDeploymentConfig] as ContractConfig).address = address
    }

}()