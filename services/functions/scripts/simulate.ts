import { ethers } from "ethers"
import { ETHEREUM_NETWORK_NAME, ETHEREUM_RPC_URL } from "@casimir/env"
import { run } from "@casimir/shell"
import { getSecret, loadCredentials } from "@casimir/aws"

async function main() {
    if (process.env.USE_SECRETS !== "false") {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || await getSecret("consensus-networks-bip39-seed") as string
    } else {
        process.env.BIP39_SEED = process.env.BIP39_SEED || "inflict ball claim confirm cereal cost note dad mix donate traffic patient"
    }
    const networkKey = process.env.FORK?.toUpperCase() || "TESTNET"
    const networkName = ETHEREUM_NETWORK_NAME[networkKey]
    process.env.ETHEREUM_FORK_RPC_URL = ETHEREUM_RPC_URL[networkKey]
    process.env.ETHEREUM_RPC_URL = "http://127.0.0.1:8545"
    console.log(`Connecting to ${networkName} network fork at ${process.env.ETHEREUM_RPC_URL}`)

    const forkProvider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_FORK_RPC_URL)
    process.env.ETHEREUM_FORK_BLOCK = process.env.ETHEREUM_FORK_BLOCK || `${await forkProvider.getBlockNumber() - 10}`
    console.log(`📍 Forking started at ${process.env.ETHEREUM_FORK_BLOCK}`)

    process.env.MINING_INTERVAL = "12"
    process.env.SIMULATE_REPORTING = "true"
    process.env.UPGRADE_CONTRACTS = "true"

    run("npm run dev --workspace @casimir/ethereum -- --network localhost")
    run("npm run dev --workspace @casimir/functions")
}

main().catch(error => {
    console.error(error)
    process.exit(1)
})