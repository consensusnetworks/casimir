import { loadCredentials, getSecret } from "@casimir/aws"
import { ETHEREUM_CONTRACTS, ETHEREUM_NETWORK_NAME, ETHEREUM_RPC_URL } from "@casimir/env"
import { run } from "@casimir/shell"

/**
 * Test ethereum contracts and services
 */
void async function () {
    if (process.env.USE_SECRETS !== "false") {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || await getSecret("consensus-networks-bip39-seed") as string
    } else {
        process.env.BIP39_SEED = process.env.BIP39_SEED || "inflict ball claim confirm cereal cost note dad mix donate traffic patient"
    }
    console.log(`Your mnemonic is ${process.env.BIP39_SEED}`)

    process.env.FORK = process.env.FORK || "testnet"

    process.env.ETHEREUM_FORK_RPC_URL = 
        process.env.ETHEREUM_FORK_RPC_URL || ETHEREUM_RPC_URL[process.env.FORK.toUpperCase()]
    if (!process.env.ETHEREUM_FORK_RPC_URL) {
        throw new Error(`Ethereum ${process.env.FORK} is not supported`)
    }

    const networkName = ETHEREUM_NETWORK_NAME[process.env.FORK.toUpperCase()]

    console.log(`Using ${networkName} fork from ${process.env.ETHEREUM_FORK_RPC_URL}`)

    process.env.SSV_NETWORK_ADDRESS = ETHEREUM_CONTRACTS[process.env.FORK.toUpperCase()]?.SSV_NETWORK_ADDRESS
    process.env.SSV_VIEWS_ADDRESS = ETHEREUM_CONTRACTS[process.env.FORK.toUpperCase()]?.SSV_VIEWS_ADDRESS
    process.env.SWAP_FACTORY_ADDRESS = ETHEREUM_CONTRACTS[process.env.FORK.toUpperCase()]?.SWAP_FACTORY_ADDRESS

    run("npm run test:debug --workspace @casimir/ethereum")
}()
