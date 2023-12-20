import { loadCredentials, getSecret } from "@casimir/aws"
import { ETHEREUM_CONTRACTS, ETHEREUM_RPC_URL } from "@casimir/env"
import { run } from "@casimir/shell"

/**
 * Start development DAO oracle service
 */
async function main() {
    process.env.CLI_PATH = process.env.CLI_PATH || "./lib/dkg/bin/ssv-dkg"
    process.env.CONFIG_PATH = process.env.CONFIG_PATH || "./config/example.dkg.initiator.yaml"

    if (process.env.USE_SECRETS !== "false") {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || await getSecret("consensus-networks-bip39-seed") as string
    } else {
        process.env.BIP39_SEED = process.env.BIP39_SEED || "inflict ball claim confirm cereal cost note dad mix donate traffic patient"
    }

    const networkKey = (process.env.NETWORK?.toUpperCase() || process.env.FORK?.toUpperCase() || "TESTNET") as keyof typeof ETHEREUM_RPC_URL & keyof typeof ETHEREUM_CONTRACTS
    
    process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || ETHEREUM_RPC_URL[networkKey]
    process.env.FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || ETHEREUM_CONTRACTS[networkKey]?.FACTORY_ADDRESS
    process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS = process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS 
    || ETHEREUM_CONTRACTS[networkKey]?.FUNCTIONS_BILLING_REGISTRY_ADDRESS

    process.env.KEEPER_REGISTRY_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.KEEPER_REGISTRY_ADDRESS
    process.env.LINK_TOKEN_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.LINK_TOKEN_ADDRESS
    process.env.SSV_NETWORK_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.SSV_NETWORK_ADDRESS
    process.env.SSV_VIEWS_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.SSV_VIEWS_ADDRESS
    process.env.SSV_TOKEN_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.SSV_TOKEN_ADDRESS
    process.env.SWAP_FACTORY_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.SWAP_FACTORY_ADDRESS
    process.env.WETH_TOKEN_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.WETH_TOKEN_ADDRESS
    
    if (!process.env.ETHEREUM_RPC_URL) throw new Error(`No ethereum rpc url provided for ${networkKey}`)
    if (!process.env.FACTORY_ADDRESS) throw new Error(`No factory address provided for ${networkKey}`)
    if (!process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS) throw new Error(`No functions billing registry address provided for ${networkKey}`)
    if (!process.env.KEEPER_REGISTRY_ADDRESS) throw new Error(`No keeper registry address provided for ${networkKey}`)
    if (!process.env.LINK_TOKEN_ADDRESS) throw new Error(`No link token address provided for ${networkKey}`)
    if (!process.env.SSV_NETWORK_ADDRESS) throw new Error(`No ssv network address provided for ${networkKey}`)
    if (!process.env.SSV_VIEWS_ADDRESS) throw new Error(`No ssv views address provided for ${networkKey}`)
    if (!process.env.SSV_TOKEN_ADDRESS) throw new Error(`No ssv token address provided for ${networkKey}`)
    if (!process.env.SWAP_FACTORY_ADDRESS) throw new Error(`No uniswap v3 factory address provided for ${networkKey}`)

    await run("GOWORK=off make -C lib/dkg build")

    process.env.USE_LOGS = process.env.USE_LOGS || "false"
    run("npx esno -r dotenv/config src/index.ts")
    console.log("🔮 Oracle service started")
}

main().catch(error => {
    console.error(error)
    process.exit(1)
})