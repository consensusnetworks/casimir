import { Account } from './Account'

export interface User {
    /** Unique ID (and essential for auth verification) */
    address: string
    /** Wallet portfolio accounts */
    accounts: Account[]
}