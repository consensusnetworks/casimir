import { loadCredentials, getSecret } from '@casimir/aws'
import { ETHEREUM_CONTRACTS, ETHEREUM_RPC_URL } from '@casimir/env'
import { run } from '@casimir/shell'

/**
 * Start the Chainlink functions service
 */
void async function() {
    
    if (process.env.USE_SECRETS !== 'false') {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || await getSecret('consensus-networks-bip39-seed') as string
    } else {
        process.env.BIP39_SEED = process.env.BIP39_SEED || 'inflict ball claim confirm cereal cost note dad mix donate traffic patient'
    }

    const networkKey = process.env.NETWORK?.toUpperCase() || process.env.FORK?.toUpperCase() || 'TESTNET'
    if (process.env.NETWORK) {
        process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || ETHEREUM_RPC_URL[networkKey]
        process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.FUNCTIONS_BILLING_REGISTRY_ADDRESS
        process.env.FUNCTIONS_ORACLE_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.FUNCTIONS_ORACLE_ADDRESS
    }
    if (!process.env.ETHEREUM_RPC_URL) throw new Error(`No ethereum rpc url provided for ${networkKey}`)
    if (!process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS) throw new Error(`No functions billing registry address provided for ${networkKey}`)
    if (!process.env.FUNCTIONS_ORACLE_ADDRESS) throw new Error('No functions oracle address provided')
    
    process.env.ETHEREUM_BEACON_RPC_URL = process.env.ETHEREUM_BEACON_RPC_URL || 'http://127.0.0.1:5052'

    process.env.USE_LOGS = process.env.USE_LOGS || 'false'
    run('npx esno -r dotenv/config src/index.ts')
    console.log('🔗 Functions service started')
}()