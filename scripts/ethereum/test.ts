import { ethers } from 'ethers'
import { run } from '@casimir/shell'
import { loadCredentials, getSecret } from '@casimir/aws'

/**
 * Test ethereum contracts and services
 */
void async function () {

    enum ETHEREUM_FORK_URL {
        MAINNET = 'https://mainnet.infura.io/v3/46a379ac6895489f812f33beb726b03b',
        TESTNET = 'https://goerli.infura.io/v3/46a379ac6895489f812f33beb726b03b'
    }

    if (process.env.USE_SECRETS !== 'false') {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || await getSecret('consensus-networks-bip39-seed') as string
    } else {
        process.env.BIP39_SEED = process.env.BIP39_SEED || 'inflict ball claim confirm cereal cost note dad mix donate traffic patient'
    }
    console.log(`Your mnemonic is ${process.env.BIP39_SEED}`)

    process.env.FORK = process.env.FORK || 'testnet'

    process.env.ETHEREUM_FORK_RPC_URL = ETHEREUM_FORK_URL[process.env.FORK.toUpperCase()]
    if (!process.env.ETHEREUM_FORK_RPC_URL) {
        throw new Error(`Ethereum ${process.env.FORK} is not supported`)
    }

    console.log(`Using ${process.env.FORK} fork from ${process.env.ETHEREUM_FORK_RPC_URL}`)

    const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_FORK_RPC_URL)
    const wallet = ethers.Wallet.fromMnemonic(process.env.BIP39_SEED)

    
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

    process.env.SSV_NETWORK_ADDRESS = '0xC3CD9A0aE89Fff83b71b58b6512D43F8a41f363D'
    process.env.SSV_VIEWS_ADDRESS = '0xAE2C84c48272F5a1746150ef333D5E5B51F68763'
    process.env.UNISWAP_V3_FACTORY_ADDRESS = process.env.UNISWAP_V3_FACTORY_ADDRESS || '0x1F98431c8aD98523631AE4a59f267346ea31F984'

    await run('npm run generate --workspace @casimir/oracle')
    run('npm run test --workspace @casimir/ethereum')
}()
