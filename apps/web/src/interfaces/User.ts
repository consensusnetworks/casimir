import { Pool, ProviderString } from '@casimir/types'

export interface User {
    id: string
    accounts: Record<ProviderString, string[]>
    primaryAccount: string
    balance?: string
    stake?: string
    rewards?: string
    pools?: Pool[]
    address: string
}