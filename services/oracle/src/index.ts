import { ethers } from 'ethers'
import CasimirManagerJson from '@casimir/ethereum/build/artifacts/src/CasimirManager.sol/CasimirManager.json'
import EventEmitter, { on } from 'events'

void async function () {
    
    const url = process.env.ETHEREUM_RPC_URL
    if (!url) throw new Error('No rpc url provided')
    const provider = new ethers.providers.JsonRpcProvider(url)

    const mnemonic = process.env.BIP39_SEED
    if (!mnemonic) throw new Error('No mnemonic provided')
    const wallet = ethers.Wallet.fromMnemonic(mnemonic)
    
    const managerAddress = process.env.PUBLIC_MANAGER_ADDRESS
    if (!managerAddress) throw new Error('No manager address provided')
    const manager = new ethers.Contract(managerAddress, CasimirManagerJson.abi, wallet).connect(provider)

    for await (const event of on(manager as unknown as EventEmitter, 'PoolFilled')) {
        const [ id, details ] = event
        console.log(`Pool ${id} filled at block number ${details.blockNumber}`)

        const pool = await manager.getPool(id)
        console.log('Pool details:', pool)
    }
}()
