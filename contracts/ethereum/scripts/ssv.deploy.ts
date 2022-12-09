import { ethers } from 'hardhat'
import { deployContract } from '@casimir/hardhat-helpers'
import { ContractConfig, DeploymentConfig } from '@casimir/types'

void async function () {
    const mockChainlink = process.env.MOCK_CHAINLINK === 'true'
    const runChainlink = process.env.RUN_CHAINLINK === 'true'
    let config: DeploymentConfig = {
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

    const mockChainlinkConfig = {
        MockOracle: {
            address: '',
            args: {
                linkTokenAddress: process.env.LINK_TOKEN_ADDRESS
            },
            options: {},
            proxy: false
        }
    }

    if (mockChainlink && !runChainlink) {
        config = {
            // Deploy Chainlink oracle first
            ...mockChainlinkConfig,
            ...config
        }
    }


    for (const name in config) {
        console.log(`Deploying ${name} contract...`)
        const { args, options, proxy } = config[name as keyof typeof config] as ContractConfig

        // Update SSVManager args with Oracle or MockOracle address
        if (name === 'SSVManager' && config.MockOracle) {
            args.linkOracleAddress = config.MockOracle.address
        }

        const contract = await deployContract(name, proxy, args, options)
        const { address } = contract

        // Semi-colon needed
        console.log(`${name} contract deployed to ${address}`);

        // Save contract address for next loop
        (config[name as keyof DeploymentConfig] as ContractConfig).address = address
    }
    
    // Set permission on the Oracle to use local node
    if (runChainlink) {
        const linkOracleOwnerAddress = '0x9d087fC03ae39b088326b67fA3C788236645b717'
        const linkOracleNodeAddress = '0x95827898f79e2Dcda28Ceaa7294ab104746dC41b'
        const impersonatedSigner = await ethers.getImpersonatedSigner(linkOracleOwnerAddress)
        const oracle = await ethers.getContractAt('Oracle', linkOracleOwnerAddress)
        const permission = await oracle.connect(impersonatedSigner).setFulfillmentPermission(linkOracleNodeAddress, true)
        await permission.wait()
        console.log(`Gave ${linkOracleNodeAddress} permission to fulfill requests for ${linkOracleOwnerAddress}`)
    }
}()