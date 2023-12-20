import { ethers } from "ethers"

export class Config {
    public readonly cliPath: string
    public readonly configPath: string
    public readonly ethereumUrl: string
    public readonly ethereumBeaconUrl: string
    public readonly wallet: ethers.Wallet
    public readonly factoryAddress: string
    public readonly beaconOracleAddress: string
    public readonly functionsBillingRegistryAddress: string
    public readonly keeperRegistryAddress: string
    public readonly linkTokenAddress: string
    public readonly ssvNetworkAddress: string
    public readonly ssvTokenAddress: string
    public readonly ssvViewsAddress: string
    public readonly swapFactoryAddress: string
    public readonly wethTokenAddress: string
    public readonly requiredEnvVars = [
        "CLI_PATH",
        "CONFIG_PATH",
        "ETHEREUM_RPC_URL",
        "ETHEREUM_BEACON_RPC_URL",
        "BIP39_SEED",
        "FACTORY_ADDRESS",
        "BEACON_ORACLE_ADDRESS",
        "FUNCTIONS_BILLING_REGISTRY_ADDRESS",
        "KEEPER_REGISTRY_ADDRESS",
        "LINK_TOKEN_ADDRESS",
        "SSV_NETWORK_ADDRESS",
        "SSV_TOKEN_ADDRESS",
        "SSV_VIEWS_ADDRESS",
        "SWAP_FACTORY_ADDRESS",
        "WETH_TOKEN_ADDRESS"
    ]

    constructor() {
        this.requiredEnvVars.forEach(v => {
            if (!process.env[v]) {
                throw new Error(`No environment variable set for ${v}`)
            }
        })
        this.cliPath = process.env.CLI_PATH as string
        this.configPath = process.env.CONFIG_PATH as string
        this.ethereumUrl = process.env.ETHEREUM_RPC_URL as string
        this.ethereumBeaconUrl = process.env.ETHEREUM_BEACON_RPC_URL as string    
        this.wallet = ethers.Wallet.fromMnemonic(process.env.BIP39_SEED as string, "m/44'/60'/0'/0/1")
        this.factoryAddress = process.env.FACTORY_ADDRESS as string
        this.beaconOracleAddress = process.env.BEACON_ORACLE_ADDRESS as string
        this.functionsBillingRegistryAddress = process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS as string
        this.keeperRegistryAddress = process.env.KEEPER_REGISTRY_ADDRESS as string
        this.linkTokenAddress = process.env.LINK_TOKEN_ADDRESS as string
        this.ssvNetworkAddress = process.env.SSV_NETWORK_ADDRESS as string
        this.ssvTokenAddress = process.env.SSV_TOKEN_ADDRESS as string
        this.ssvViewsAddress = process.env.SSV_VIEWS_ADDRESS as string
        this.swapFactoryAddress = process.env.SWAP_FACTORY_ADDRESS as string
        this.wethTokenAddress = process.env.WETH_TOKEN_ADDRESS as string
    }
}
