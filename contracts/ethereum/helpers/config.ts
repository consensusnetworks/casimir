export class Config {
    public readonly beaconLibraryAddress: string
    public readonly beaconOracleAddress: string 
    public readonly depositContractAddress: string
    public readonly eigenpodManagerAddress: string
    public readonly ethereumUrl: string
    public readonly factoryAddress: string
    public readonly functionsBillingRegistryAddress: string
    public readonly functionsOracleAddress: string
    public readonly keeperRegistrarAddress: string
    public readonly keeperRegistryAddress: string
    public readonly linkEthFeedAddress: string
    public readonly linkTokenAddress: string
    public readonly managerBeaconAddress: string
    public readonly poolBeaconAddress: string
    public readonly registryBeaconAddress: string
    public readonly ssvNetworkAddress: string
    public readonly ssvTokenAddress: string
    public readonly ssvViewsAddress: string
    public readonly swapFactoryAddress: string
    public readonly swapRouterAddress: string
    public readonly upkeepBeaconAddress: string
    public readonly viewsBeaconAddress: string
    public readonly wethTokenAddress: string
    public readonly requiredEnvVars = [
        "BEACON_LIBRARY_ADDRESS",
        "BEACON_ORACLE_ADDRESS",
        "DEPOSIT_CONTRACT_ADDRESS",
        "EIGENPOD_MANAGER_ADDRESS",
        "ETHEREUM_RPC_URL",
        "FACTORY_ADDRESS",
        "FUNCTIONS_BILLING_REGISTRY_ADDRESS",
        "FUNCTIONS_ORACLE_ADDRESS",
        "KEEPER_REGISTRAR_ADDRESS",
        "KEEPER_REGISTRY_ADDRESS",
        "LINK_ETH_FEED_ADDRESS",
        "LINK_TOKEN_ADDRESS",
        "MANAGER_BEACON_ADDRESS",
        "POOL_BEACON_ADDRESS",
        "REGISTRY_BEACON_ADDRESS",
        "SSV_NETWORK_ADDRESS",
        "SSV_TOKEN_ADDRESS",
        "SSV_VIEWS_ADDRESS",
        "SWAP_FACTORY_ADDRESS",
        "SWAP_ROUTER_ADDRESS",
        "UPKEEP_BEACON_ADDRESS",
        "VIEWS_BEACON_ADDRESS",
        "WETH_TOKEN_ADDRESS"
    ]

    constructor() {
        this.requiredEnvVars.forEach(v => {
            if (!process.env[v]) {
                throw new Error(`No environment variable set for ${v}`)
            }
        })
        this.beaconLibraryAddress = process.env.BEACON_LIBRARY_ADDRESS as string
        this.beaconOracleAddress = process.env.BEACON_ORACLE_ADDRESS as string
        this.depositContractAddress = process.env.DEPOSIT_CONTRACT_ADDRESS as string
        this.eigenpodManagerAddress = process.env.EIGENPOD_MANAGER_ADDRESS as string
        this.ethereumUrl = process.env.ETHEREUM_RPC_URL as string
        this.factoryAddress = process.env.FACTORY_ADDRESS as string
        this.functionsBillingRegistryAddress = process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS as string
        this.functionsOracleAddress = process.env.FUNCTIONS_ORACLE_ADDRESS as string
        this.keeperRegistrarAddress = process.env.KEEPER_REGISTRAR_ADDRESS as string
        this.keeperRegistryAddress = process.env.KEEPER_REGISTRY_ADDRESS as string
        this.linkEthFeedAddress = process.env.LINK_ETH_FEED_ADDRESS as string
        this.linkTokenAddress = process.env.LINK_TOKEN_ADDRESS as string
        this.managerBeaconAddress = process.env.MANAGER_BEACON_ADDRESS as string
        this.poolBeaconAddress = process.env.POOL_BEACON_ADDRESS as string
        this.registryBeaconAddress = process.env.REGISTRY_BEACON_ADDRESS as string
        this.ssvNetworkAddress = process.env.SSV_NETWORK_ADDRESS as string
        this.ssvTokenAddress = process.env.SSV_TOKEN_ADDRESS as string
        this.ssvViewsAddress = process.env.SSV_VIEWS_ADDRESS as string
        this.swapFactoryAddress = process.env.SWAP_FACTORY_ADDRESS as string
        this.swapRouterAddress = process.env.SWAP_ROUTER_ADDRESS as string
        this.upkeepBeaconAddress = process.env.UPKEEP_BEACON_ADDRESS as string
        this.viewsBeaconAddress = process.env.VIEWS_BEACON_ADDRESS as string
        this.wethTokenAddress = process.env.WETH_TOKEN_ADDRESS as string
    }
}