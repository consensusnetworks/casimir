import { ethers } from 'ethers'

export function getConfig() {
    const cliPath = process.env.CLI_PATH
    if (!cliPath) throw new Error('No cli path provided')
    const messengerUrl = process.env.MESSENGER_URL
    if (!messengerUrl) throw new Error('No messenger url provided')

    const ethereumUrl = process.env.ETHEREUM_RPC_URL
    if (!ethereumUrl) throw new Error('No ethereum rpc url provided')

    const mnemonic = process.env.BIP39_SEED
    if (!mnemonic) throw new Error('No mnemonic provided')
    const pathIndex = process.env.BIP39_PATH_INDEX
    const path = `m/44'/60'/0'/0/${pathIndex || 0}`
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, path)
    
    const managerAddress = process.env.MANAGER_ADDRESS
    if (!managerAddress) throw new Error('No manager address provided')
    const viewsAddress = process.env.VIEWS_ADDRESS
    if (!viewsAddress) throw new Error('No views address provided')
    const registryAddress = process.env.REGISTRY_ADDRESS
    if (!registryAddress) throw new Error('No registry address provided')
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

    return {
        cliPath,
        messengerUrl,
        ethereumUrl,
        wallet,
        managerAddress,
        viewsAddress,
        registryAddress,
        linkTokenAddress,
        ssvNetworkAddress,
        ssvNetworkViewsAddress,
        ssvTokenAddress,
        uniswapV3FactoryAddress,
        wethTokenAddress
    }
}
