import { ethers } from 'ethers'
import CasimirManagerJson from '@casimir/ethereum/build/artifacts/src/CasimirManager.sol/CasimirManager.json'
import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'

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

    /** Get network contract addresses */
    const networkAddress = process.env.NETWORK_ADDRESS
    if (!networkAddress) throw new Error('No network address provided')
    const networkViewsAddress = process.env.NETWORK_VIEWS_ADDRESS
    if (!networkViewsAddress) throw new Error('No network views address provided')
    
    /** Get DKG CLI path */
    const cliPath = process.env.CLI_PATH
    if (!cliPath) throw new Error('No cli path provided')

    /** Get DKG messenger service url */
    const messengerUrl = process.env.MESSENGER_SRV_ADDR
    if (!messengerUrl) throw new Error('No messenger url provided')

    return { provider, signer, manager, networkAddress, networkViewsAddress, cliPath, messengerUrl }
}
