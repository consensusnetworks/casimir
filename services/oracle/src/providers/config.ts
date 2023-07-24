import { ethers } from 'ethers'
import CasimirManagerJson from '@casimir/ethereum/build/artifacts/src/v1/CasimirManager.sol/CasimirManager.json'
import CasimirViewsJson from '@casimir/ethereum/build/artifacts/src/v1/CasimirViews.sol/CasimirViews.json'
import { CasimirManager, CasimirViews } from '@casimir/ethereum/build/artifacts/types'

const supportedStrategies = ['dkg', 'ethdo']

export function getConfig() {
    const ethereumUrl = process.env.ETHEREUM_RPC_URL
    if (!ethereumUrl) throw new Error('No ethereum rpc url provided')

    const mnemonic = process.env.BIP39_SEED
    if (!mnemonic) throw new Error('No mnemonic provided')
    const pathIndex = process.env.BIP39_PATH_INDEX
    const path = `m/44'/60'/0'/0/${pathIndex || 0}`
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, path)
    
    const managerAddress = process.env.MANAGER_ADDRESS
    if (!managerAddress) throw new Error('No manager address provided')
    const manager = new ethers.Contract(managerAddress, CasimirManagerJson.abi) as ethers.Contract & CasimirManager

    const viewsAddress = process.env.VIEWS_ADDRESS
    if (!viewsAddress) throw new Error('No views address provided')
    const views = new ethers.Contract(viewsAddress, CasimirViewsJson.abi) as CasimirViews & ethers.Contract

    const linkTokenAddress = process.env.LINK_TOKEN_ADDRESS
    if (!linkTokenAddress) throw new Error('No link token address provided')
    const ssvNetworkAddress = process.env.SSV_NETWORK_ADDRESS
    if (!ssvNetworkAddress) throw new Error('No ssv network address provided')
    const ssvNetworkViewsAddress = process.env.SSV_NETWORK_VIEWS_ADDRESS
    if (!ssvNetworkViewsAddress) throw new Error('No ssv network views address provided')
    const ssvTokenAddress = process.env.SSV_TOKEN_ADDRESS
    if (!ssvTokenAddress) throw new Error('No ssv token address provided')
    const uniswapV3FactoryAddress = process.env.UNISWAP_V3_FACTORY_ADDRESS
    if (!uniswapV3FactoryAddress) throw new Error('No uniswap v3 factory address provided')
    const wethTokenAddress = process.env.WETH_TOKEN_ADDRESS
    if (!wethTokenAddress) throw new Error('No weth token address provided')

    const strategy = process.env.STRATEGY
    if (!strategy || !supportedStrategies.includes(strategy)) throw new Error('No strategy provided')
    const cliPath = process.env.CLI_PATH
    if (!cliPath) throw new Error('No cli path provided')
    const messengerUrl = process.env.MESSENGER_SRV_ADDR
    if (!messengerUrl && strategy === 'dkg') throw new Error('No messenger url provided')

    return { 
        ethereumUrl,
        wallet,
        manager,
        views,
        linkTokenAddress,
        ssvNetworkAddress,
        ssvNetworkViewsAddress,
        ssvTokenAddress,
        uniswapV3FactoryAddress,
        wethTokenAddress,
        strategy,
        cliPath,
        messengerUrl
    }
}
