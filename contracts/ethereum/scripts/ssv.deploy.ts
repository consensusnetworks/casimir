import { deployContract } from '@casimir/hardhat-helpers'
import { ContractConfig, SSVContractConfigs } from '@casimir/types'

void async function () {
    const mockChainlink = process.env.MOCK_CHAINLINK === 'true'
    let contracts: SSVContractConfigs = {
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

    const chainlinkContracts = {
        LinkToken: {
            address: '',
            args: {},
            options: {},
            proxy: false
        },
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
        contracts = {
            // Deploy Chainlink contracts first
            ...chainlinkContracts,
            ...contracts
        }
    }

    for (const name in contracts) {
        console.log(`Deploying ${name} contract...`)
        const { args, options, proxy } = contracts[name as keyof typeof contracts] as ContractConfig
        // Update linkTokenAddress with LinkToken.address for MockOracle deployment
        if (name === 'MockOracle') {
            args.linkTokenAddress = contracts['LinkToken']?.['address']
        }
        const contract = await deployContract(name, proxy, args, options)

        const { address } = contract

        // Semi-colon needed
        console.log(`${name} contract deployed to ${address}`);

        // Save contract address for next loop
        (contracts[name as keyof SSVContractConfigs] as ContractConfig)['address'] = address
    }

}()