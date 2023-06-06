import { deployContract } from '@casimir/ethereum/helpers/deploy'
import { ContractConfig, DeploymentConfig } from '@casimir/types'

void async function () {
    const config: DeploymentConfig = {
        CasimirManager: {
            address: '',
            args: {
                oracleAddress: process.env.ORACLE_ADDRESS,
                beaconDepositAddress: process.env.BEACON_DEPOSIT_ADDRESS,
                linkFunctionsAddress: process.env.LINK_FUNCTIONS_ADDRESS,
                linkRegistrarAddress: process.env.LINK_REGISTRAR_ADDRESS,
                linkRegistryAddress: process.env.LINK_REGISTRY_ADDRESS,
                linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
                ssvNetworkAddress: process.env.SSV_NETWORK_ADDRESS,
                ssvNetworkViewsAddress: process.env.SSV_NETWORK_VIEWS_ADDRESS,
                ssvTokenAddress: process.env.SSV_TOKEN_ADDRESS,
                swapFactoryAddress: process.env.SWAP_FACTORY_ADDRESS,
                swapRouterAddress: process.env.SWAP_ROUTER_ADDRESS,
                wethTokenAddress: process.env.WETH_TOKEN_ADDRESS
            },
            options: {},
            proxy: false
        },
        CasimirViews: {
            address: '',
            args: {
                managerAddress: ''
            },
            options: {},
            proxy: false
        }
    }

    for (const name in config) {
        if (name === 'CasimirViews') {
            (config[name as keyof typeof config] as ContractConfig).args.managerAddress = config.CasimirManager.address
        }

        const { args, options, proxy } = config[name as keyof typeof config] as ContractConfig

        const contract = await deployContract(name, proxy, args, options)
        const { address } = contract

        console.log(`${name} contract deployed to ${address}`)

        ;(config[name as keyof DeploymentConfig] as ContractConfig).address = address
    }
}()