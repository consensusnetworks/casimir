import { loadCredentials, getSecret } from "@casimir/aws"
import { ETHEREUM_NETWORK_NAME } from "@casimir/env"
import { run } from "@casimir/shell"

/**
 * Request a new report on testnet
 */
void async function () {
    if (process.env.USE_SECRETS !== "false") {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || await getSecret("consensus-networks-bip39-seed") as string
    } else {
        process.env.BIP39_SEED = process.env.BIP39_SEED || "inflict ball claim confirm cereal cost note dad mix donate traffic patient"
    }
    console.log(`Your mnemonic seed is ${process.env.BIP39_SEED}`)
    const networkName = process.env.NETWORK?.toUpperCase() || "TESTNET"

    run(`npm run report --workspace @casimir/ethereum -- --network ${ETHEREUM_NETWORK_NAME[networkName]}`)
}()
