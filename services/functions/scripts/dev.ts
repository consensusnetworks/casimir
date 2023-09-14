import { run } from '@casimir/shell'

/**
 * Start the Chainlink functions service
 */
void async function() {
    process.env.BIP39_SEED = process.env.BIP39_SEED || 'inflict ball claim confirm cereal cost note dad mix donate traffic patient'
    process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'http://127.0.0.1:8545'
    process.env.ETHEREUM_BEACON_RPC_URL = process.env.ETHEREUM_BEACON_RPC_URL || 'http://127.0.0.1:5052'
    if (!process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS) throw new Error('No functions billing registry address provided')
    if (!process.env.FUNCTIONS_ORACLE_ADDRESS) throw new Error('No functions oracle address provided')

    process.env.USE_LOGS = process.env.USE_LOGS || 'false'
    run(`npx esno -r dotenv/config src/index.ts${process.env.USE_LOGS === 'true' ? ' >> .log/functions.log' : ''}`)
    console.log('🔗 Functions service started')
}()