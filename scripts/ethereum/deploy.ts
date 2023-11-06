import { loadCredentials, getSecret } from "@casimir/aws"
import { ETHEREUM_NETWORK_NAME, ETHEREUM_RPC_URL } from "@casimir/env"
import { run } from "@casimir/shell"

/**
 * Deploy ethereum contracts
 */
void async function () {
    if (process.env.USE_SECRETS !== "false") {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || await getSecret("consensus-networks-bip39-seed") as string
    } else {
        process.env.BIP39_SEED = process.env.BIP39_SEED || "inflict ball claim confirm cereal cost note dad mix donate traffic patient"
    }
    console.log(`Your mnemonic seed is ${process.env.BIP39_SEED}`)

    process.env.NETWORK = process.env.NETWORK || "testnet"
    process.env.ETHEREUM_RPC_URL = ETHEREUM_RPC_URL[process.env.NETWORK.toUpperCase()]
    const networkName = ETHEREUM_NETWORK_NAME[process.env.NETWORK.toUpperCase()]
    
    console.log(`Using ${networkName} network from ${process.env.ETHEREUM_RPC_URL}`)

    run(`npm run deploy --workspace @casimir/ethereum -- --network ${networkName}`)
}()
