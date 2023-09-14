import { run } from '@casimir/shell'
import { loadCredentials, getSecret } from '@casimir/aws'

/**
 * Run an ethereum development environment
 */
void async function () {
    enum ETHEREUM_NETWORK_NAME {
        MAINNET = 'mainnet',
        TESTNET = 'goerli'
    }
    enum ETHEREUM_NETWORK_URL {
        MAINNET = 'https://mainnet.infura.io/v3/46a379ac6895489f812f33beb726b03b',
        TESTNET = 'https://goerli.infura.io/v3/46a379ac6895489f812f33beb726b03b'
    }

    if (process.env.USE_SECRETS !== 'false') {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || await getSecret('consensus-networks-bip39-seed') as string
    } else {
        process.env.BIP39_SEED = process.env.BIP39_SEED || 'inflict ball claim confirm cereal cost note dad mix donate traffic patient'
    }
    console.log(`Your mnemonic seed is ${process.env.BIP39_SEED}`)

    process.env.NETWORK = process.env.NETWORK || 'testnet'
    process.env.TUNNEL = process.env.TUNNEL || 'false'
    process.env.MINING_INTERVAL = '12'
    process.env.ETHEREUM_RPC_URL = ETHEREUM_NETWORK_URL[process.env.NETWORK.toUpperCase()]
    const networkName = ETHEREUM_NETWORK_NAME[process.env.NETWORK.toUpperCase()]
    
    console.log(`Using ${networkName} network from ${process.env.ETHEREUM_RPC_URL}`)

    run(`npm run deploy --workspace @casimir/ethereum -- --network ${networkName}`)
}()
