import { ethers } from 'ethers'
import CasimirManagerJson from '@casimir/ethereum/build/artifacts/src/v1/CasimirManager.sol/CasimirManager.json'
import CasimirViewsJson from '@casimir/ethereum/build/artifacts/src/v1/CasimirViews.sol/CasimirViews.json'
import { CasimirManager, CasimirViews } from '@casimir/ethereum/build/artifacts/types'

export function config() {
    /** Get JSON RPC node provider */
    const url = process.env.ETHEREUM_RPC_URL
    if (!url) throw new Error('No rpc url provided')
    const provider = new ethers.providers.JsonRpcProvider(url)
    
    /** Get transaction signer */
    const mnemonic = process.env.BIP39_SEED
    // const pathIndex = process.env.BIP39_PATH_INDEX
    // const path = `m/44'/60'/0'/0/${pathIndex || 0}`
    if (!mnemonic) throw new Error('No mnemonic provided')
    const signer = ethers.Wallet.fromMnemonic(mnemonic, 'm/44\'/60\'/0\'/0/6').connect(provider)
    
    /** Get manager contract */
    const managerAddress = process.env.MANAGER_ADDRESS
    if (!managerAddress) throw new Error('No manager address provided')
    const manager = new ethers.Contract(managerAddress, CasimirManagerJson.abi, provider) as CasimirManager & ethers.Contract
    
    /** Get views contract */
    const viewsAddress = process.env.VIEWS_ADDRESS
    if (!viewsAddress) throw new Error('No views address provided')
    const views = new ethers.Contract(viewsAddress, CasimirViewsJson.abi, provider) as CasimirViews & ethers.Contract

    /** Get token addresses */
    const linkTokenAddress = process.env.LINK_TOKEN_ADDRESS
    if (!linkTokenAddress) throw new Error('No link token address provided')
    const ssvTokenAddress = process.env.SSV_TOKEN_ADDRESS
    if (!ssvTokenAddress) throw new Error('No ssv token address provided')
    const wethTokenAddress = process.env.WETH_TOKEN_ADDRESS
    if (!wethTokenAddress) throw new Error('No weth token address provided')

    /** Get DKG CLI path */
    const cliPath = process.env.CLI_PATH
    if (!cliPath) throw new Error('No cli path provided')

    /** Get DKG messenger service url */
    const messengerUrl = process.env.MESSENGER_SRV_ADDR
    if (!messengerUrl) throw new Error('No messenger url provided')

    return { 
        provider,
        signer,
        manager,
        views,
        linkTokenAddress,
        ssvTokenAddress,
        wethTokenAddress,
        cliPath,
        messengerUrl
    }
}
