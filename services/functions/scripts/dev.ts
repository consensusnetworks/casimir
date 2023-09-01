import { run } from '@casimir/shell'

/**
 * Start the Chainlink functions service
 */
void async function() {
    process.env.BIP39_SEED = process.env.BIP39_SEED || 'inflict ball claim confirm cereal cost note dad mix donate traffic patient'
    process.env.BIP39_PATH_INDEX = process.env.BIP39_PATH_INDEX || '5'
    if (!process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS) throw new Error('No functions billing registry address provided')
    if (!process.env.UPKEEP_ADDRESS) throw new Error('No upkeep address provided')

    run('npx esno -r dotenv/config src/index.ts')
    console.log('🔗 Functions service started')
}()