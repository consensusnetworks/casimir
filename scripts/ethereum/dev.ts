import { ethers } from 'ethers'
import { getWallet, run } from '@casimir/helpers'
import { loadCredentials, getSecret } from '@casimir/aws'

/**
 * Run an ethereum development environment
 */
void async function () {

    enum ETHEREUM_FORK_URL {
        MAINNET = 'https://mainnet.infura.io/v3/46a379ac6895489f812f33beb726b03b',
        TESTNET = 'https://goerli.infura.io/v3/46a379ac6895489f812f33beb726b03b'
    }

    if (process.env.USE_SECRETS !== 'false') {
        await loadCredentials()
    }

    process.env.BIP39_SEED = process.env.USE_SECRETS !== 'false' ? process.env.BIP39_SEED || await getSecret('consensus-networks-bip39-seed') : process.env.BIP39_SEED || 'inflict ball claim confirm cereal cost note dad mix donate traffic patient'
    process.env.FORK = process.env.FORK || 'testnet'
    process.env.TUNNEL = process.env.TUNNEL || 'false'
    process.env.MINING_INTERVAL = '12'
    process.env.ETHEREUM_RPC_URL = 'http://127.0.0.1:8545'

    console.log(`Your mnemonic seed is ${process.env.BIP39_SEED}}`)

    process.env.ETHEREUM_FORK_RPC_URL = ETHEREUM_FORK_URL[process.env.FORK.toUpperCase()]
    if (!process.env.ETHEREUM_FORK_RPC_URL) {
        throw new Error(`Ethereum ${process.env.FORK} is not supported`)
    }

    console.log(`Using ${process.env.FORK} fork from ${process.env.ETHEREUM_FORK_RPC_URL}`)
    console.log(`Serving local fork at ${process.env.ETHEREUM_RPC_URL}`)

    const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_FORK_RPC_URL)
    process.env.ETHEREUM_FORK_BLOCK = process.env.ETHEREUM_FORK_BLOCK || `${await provider.getBlockNumber() - 5}`
    console.log(`📍 Forking started at ${process.env.ETHEREUM_FORK_BLOCK}`)

    const wallet = getWallet(process.env.BIP39_SEED)

    // Account for the mock Chainlink functions deployments
    const deployerNonce = await provider.getTransactionCount(wallet.address) + 5
    
    if (!process.env.MANAGER_ADDRESS) {
        process.env.MANAGER_ADDRESS = ethers.utils.getContractAddress({
            from: wallet.address,
            nonce: deployerNonce
        })
    }

    if (!process.env.VIEWS_ADDRESS) {
        process.env.VIEWS_ADDRESS = ethers.utils.getContractAddress({
            from: wallet.address,
            nonce: deployerNonce + 1
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

    process.env.SSV_NETWORK_ADDRESS = '0xAfdb141Dd99b5a101065f40e3D7636262dce65b3'
    process.env.SSV_NETWORK_VIEWS_ADDRESS = '0x8dB45282d7C4559fd093C26f677B3837a5598914'
    process.env.UNISWAP_V3_FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'

    run('npm run node --workspace @casimir/ethereum')
    const hardhatWaitTime = 2500
    await new Promise(resolve => setTimeout(resolve, hardhatWaitTime))
    run('npm run dev --workspace @casimir/ethereum -- --network localhost')
}()
