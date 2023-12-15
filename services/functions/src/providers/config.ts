import { ethers } from "ethers"

export class Config {
    public readonly ethereumUrl: string
    public readonly functionsBillingRegistryAddress: string
    public readonly functionsOracleAddress: string
    public readonly wallet: ethers.Wallet
    public readonly requiredEnvVars = [
        "ETHEREUM_RPC_URL",
        "BIP39_SEED",
        "FUNCTIONS_BILLING_REGISTRY_ADDRESS",
        "FUNCTIONS_ORACLE_ADDRESS"
    ]
    public readonly dryRun = process.env.DRY_RUN === "true"

    constructor() {
        this.requiredEnvVars.forEach(v => {
            if (!process.env[v]) {
                throw new Error(`No environment variable set for ${v}`)
            }
        })
        this.ethereumUrl = process.env.ETHEREUM_RPC_URL as string
        this.functionsBillingRegistryAddress = process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS as string
        this.functionsOracleAddress = process.env.FUNCTIONS_ORACLE_ADDRESS as string
        this.wallet = ethers.Wallet.fromMnemonic(process.env.BIP39_SEED as string, "m/44'/60'/0'/0/2")
    }
}