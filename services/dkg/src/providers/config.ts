import { ethers } from 'ethers'
import CasimirManagerJson from '@casimir/ethereum/build/artifacts/src/CasimirManager.sol/CasimirManager.json'
import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'

export function config() {
    const url = process.env.ETHEREUM_RPC_URL
    if (!url) throw new Error('No rpc url provided')
    const provider = new ethers.providers.JsonRpcProvider(url)
    
    const mnemonic = process.env.BIP39_SEED
    if (!mnemonic) throw new Error('No mnemonic provided')
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, 'm/44\'/60\'/0\'/0/6')

    const signer = wallet.connect(provider)
    
    const managerAddress = process.env.PUBLIC_MANAGER_ADDRESS
    if (!managerAddress) throw new Error('No manager address provided')
    const manager = new ethers.Contract(managerAddress, CasimirManagerJson.abi, signer) as ethers.Contract & CasimirManager

    const messengerUrl = process.env.MESSENGER_SRV_ADDR
    if (!messengerUrl) throw new Error('No messenger url provided')

    return { manager, signer, messengerUrl }
}
