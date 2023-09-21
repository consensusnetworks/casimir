import { ethers } from 'ethers'
import { loadCredentials, getSecret } from '@casimir/aws'
import { ETHEREUM_CONTRACTS, ETHEREUM_RPC_URL } from '@casimir/env'
import { run } from '@casimir/shell'

/**
 * Run an ethereum development environment
 */
void async function () {
    if (process.env.USE_SECRETS !== 'false') {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || await getSecret('consensus-networks-bip39-seed') as string
    } else {
        process.env.BIP39_SEED = process.env.BIP39_SEED || 'inflict ball claim confirm cereal cost note dad mix donate traffic patient'
    }
    console.log(`Your mnemonic seed is ${process.env.BIP39_SEED}`)

    process.env.FORK = process.env.FORK || 'testnet'
    process.env.TUNNEL = process.env.TUNNEL || 'false'
    process.env.MINING_INTERVAL = '12'
    process.env.ETHEREUM_RPC_URL = 'http://127.0.0.1:8545'

    process.env.ETHEREUM_FORK_RPC_URL = ETHEREUM_RPC_URL[process.env.FORK.toUpperCase()]
    if (!process.env.ETHEREUM_FORK_RPC_URL) {
        throw new Error(`Ethereum ${process.env.FORK} is not supported`)
    }

    console.log(`Using ${process.env.FORK} fork from ${process.env.ETHEREUM_FORK_RPC_URL}`)
    console.log(`Serving local fork at ${process.env.ETHEREUM_RPC_URL}`)

    const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_FORK_RPC_URL)
    process.env.ETHEREUM_FORK_BLOCK = process.env.ETHEREUM_FORK_BLOCK || `${await provider.getBlockNumber() - 5}`
    console.log(`📍 Forking started at ${process.env.ETHEREUM_FORK_BLOCK}`)

    const wallet = ethers.Wallet.fromMnemonic(process.env.BIP39_SEED)

    // Account for the mock, beacon, and library deployments
    const walletNonce = await provider.getTransactionCount(wallet.address) + 14

    if (!process.env.MANAGER_ADDRESS) {
        process.env.MANAGER_ADDRESS = ethers.utils.getContractAddress({
            from: wallet.address,
            nonce: walletNonce
        })
    }

    if (!process.env.REGISTRY_ADDRESS) {
        process.env.REGISTRY_ADDRESS = ethers.utils.getContractAddress({
          from: process.env.MANAGER_ADDRESS,
          nonce: 1
        })
    }

    if (!process.env.UPKEEP_ADDRESS) {
        process.env.UPKEEP_ADDRESS = ethers.utils.getContractAddress({
            from: process.env.MANAGER_ADDRESS,
            nonce: 2
        })
    }

    if (!process.env.VIEWS_ADDRESS) {
        process.env.VIEWS_ADDRESS = ethers.utils.getContractAddress({
            from: wallet.address,
            nonce: walletNonce + 2
        })
    }

    process.env.SSV_NETWORK_ADDRESS = ETHEREUM_CONTRACTS[process.env.FORK.toUpperCase()]?.SSV_NETWORK_ADDRESS
    process.env.SSV_VIEWS_ADDRESS = ETHEREUM_CONTRACTS[process.env.FORK.toUpperCase()]?.SSV_VIEWS_ADDRESS
    process.env.SWAP_FACTORY_ADDRESS = ETHEREUM_CONTRACTS[process.env.FORK.toUpperCase()]?.SWAP_FACTORY_ADDRESS

    run('npm run node --workspace @casimir/ethereum')
    const hardhatWaitTime = 2500
    await new Promise(resolve => setTimeout(resolve, hardhatWaitTime))
    run('npm run dev --workspace @casimir/ethereum -- --network localhost')
}()
