import { ethers } from 'ethers'
import CasimirManagerJson from '@casimir/ethereum/build/artifacts/src/CasimirManager.sol/CasimirManager.json'
import SSVNetworkJson from '@casimir/ethereum/build/artifacts/src/vendor/interfaces/ISSVNetwork.sol/ISSVNetwork.json'
import { CasimirManager, ISSVNetwork } from '@casimir/ethereum/build/artifacts/types'

export async function config() {
    const url = process.env.ETHEREUM_RPC_URL
    if (!url) throw new Error('No rpc url provided')
    const provider = new ethers.JsonRpcProvider(url)
    
    const mnemonic = process.env.BIP39_SEED
    const pathIndex = process.env.BIP39_PATH_INDEX
    if (!mnemonic) throw new Error('No mnemonic provided')
    ethers.Wallet.fromPhrase(mnemonic, provider)
    const accounts = await provider.listAccounts()
    const signer = accounts[Number(pathIndex || 0)]
    
    const managerAddress = process.env.MANAGER_ADDRESS
    if (!managerAddress) throw new Error('No manager address provided')
    const manager = new ethers.Contract(managerAddress, CasimirManagerJson.abi, provider) as CasimirManager & ethers.Contract

    const ssvAddress = process.env.SSV_ADDRESS
    if (!ssvAddress) throw new Error('No ssv address provided')
    const ssv = new ethers.Contract(ssvAddress, SSVNetworkJson.abi, provider) as ISSVNetwork & ethers.Contract

    const cliPath = process.env.CLI_PATH
    if (!cliPath) throw new Error('No cli path provided')

    const messengerUrl = process.env.MESSENGER_SRV_ADDR
    if (!messengerUrl) throw new Error('No messenger url provided')

    return { manager, ssv, provider, signer, cliPath, messengerUrl }
}
