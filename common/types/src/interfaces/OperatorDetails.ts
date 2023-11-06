export interface OperatorDetails {
    id_str: string
    declared_fee: number
    previous_fee: number
    fee: number // Todo check if this is bigint
    name: string
    public_key: string
    owner_address: string
    address: string
    location: string
    setup_provider: string
    eth1_node_client: string
    eth2_node_client: string
    description: string
    website_url: string
    twitter_url: string
    linkedin_url: string
    logo: string
    type: string
    performance: {
        "24h": number
        "30d": number
    },
    is_active: number
    is_valid: boolean
    is_deleted: boolean
    status: string // Todo check for enum (i.e., 'Active'...)
    validators_count: number
    url: string // Todo check if this is usable in DKG
}