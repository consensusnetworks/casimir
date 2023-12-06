import { ethers } from "ethers"

export function getConfig() {
    const dryRun = process.env.DRY_RUN === "true"

    const ethereumUrl = process.env.ETHEREUM_RPC_URL
    if (!ethereumUrl) throw new Error("No ethereum rpc url provided")

    const mnemonic = process.env.BIP39_SEED
    if (!mnemonic) throw new Error("No mnemonic provided")
    const accountPath = "m/44'/60'/0'/0/2"
    const wallet = ethers.Wallet.fromMnemonic(mnemonic, accountPath)

    const functionsBillingRegistryAddress = process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS
    if (!functionsBillingRegistryAddress) throw new Error("No functions billing registry address provided")
    
    const functionsOracleAddress = process.env.FUNCTIONS_ORACLE_ADDRESS
    if (!functionsOracleAddress) throw new Error("No functions oracle address provided")

    return {
        dryRun,
        ethereumUrl,
        functionsBillingRegistryAddress,
        functionsOracleAddress,
        wallet
    }
}