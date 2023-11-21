export interface SSVOperator {
    id: number
    id_str: string
    declared_fee: string
    previous_fee: string
    fee: string
    public_key: string
    owner_address: string
    address_whitelist: string
    location: string
    setup_provider: string
    eth1_node_client: string
    eth2_node_client: string
    mev_relays: string
    description: string
    website_url: string
    twitter_url: string
    linkedin_url: string
    dkg_address: string
    logo: string
    type: string
    name: string
    performance: {
        "24h": number
        "30d": number
    }
    is_valid: boolean
    is_deleted: boolean
    is_active: number
    status: string
    validators_count: number
    version: "v4"
    network: "mainnet" | "prater"
}