import { loadCredentials, getSecret } from '@casimir/aws'
import { ETHEREUM_CONTRACTS, ETHEREUM_NETWORK_NAME } from '@casimir/env'
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

    process.env.SSV_NETWORK_ADDRESS = ETHEREUM_CONTRACTS['TESTNET'].SSV_NETWORK_ADDRESS
    process.env.SSV_VIEWS_ADDRESS = ETHEREUM_CONTRACTS['TESTNET'].SSV_VIEWS_ADDRESS
    process.env.SWAP_FACTORY_ADDRESS = ETHEREUM_CONTRACTS['TESTNET'].SWAP_FACTORY_ADDRESS

    run(`npm run report --workspace @casimir/ethereum -- --network ${ETHEREUM_NETWORK_NAME['TESTNET']}`)
}()
