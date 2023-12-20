import { ethers } from "ethers"
import { loadCredentials, getSecret } from "@casimir/aws"
import { ETHEREUM_CONTRACTS, ETHEREUM_NETWORK_NAME, ETHEREUM_RPC_URL } from "@casimir/env"
import { run } from "@casimir/shell"

/**
 * Test ethereum contracts
 */
async function test() {
    if (process.env.USE_SECRETS !== "false") {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || await getSecret("consensus-networks-bip39-seed") as string
    } else {
        process.env.BIP39_SEED = process.env.BIP39_SEED || "inflict ball claim confirm cereal cost note dad mix donate traffic patient"
    }
    console.log(`Your mnemonic is ${process.env.BIP39_SEED}`)

    process.env.FORK = process.env.FORK || "testnet"

    const networkKey = process.env.FORK.toUpperCase() as keyof typeof ETHEREUM_RPC_URL
    process.env.ETHEREUM_FORK_RPC_URL = ETHEREUM_RPC_URL[networkKey]
    
    const networkName = ETHEREUM_NETWORK_NAME[networkKey]
    console.log(`Using ${networkName} fork from ${process.env.ETHEREUM_FORK_RPC_URL}`)

    const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_FORK_RPC_URL)
    const wallet = ethers.Wallet.fromMnemonic(process.env.BIP39_SEED)

    const factoryNonceDiff = 17 // Account for the mock, beacon, and library deployments
    const walletNonce = await provider.getTransactionCount(wallet.address) + factoryNonceDiff
    process.env.FACTORY_NONCE_DIFF = factoryNonceDiff.toString()

    process.env.FACTORY_ADDRESS = ethers.utils.getContractAddress({
        from: wallet.address,
        nonce: walletNonce
    })
    console.log(`Expecting factory at ${process.env.FACTORY_ADDRESS}`)

    process.env.SSV_NETWORK_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.SSV_NETWORK_ADDRESS
    process.env.SSV_VIEWS_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.SSV_VIEWS_ADDRESS
    process.env.SWAP_FACTORY_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.SWAP_FACTORY_ADDRESS

    process.env.KEYS_DIR = `${process.cwd()}/keys`
    await run("npm run generate --workspace @casimir/oracle")
    run("npx hardhat test")
}

test().catch(error => {
    console.error(error)
    process.exit(1)
})