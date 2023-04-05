import { Account } from '@casimir/types'

export interface UserWithAccounts {
    /** Unique ID (and essential for auth verification) */
    address: string
    /** An array of the user's accounts */
    accounts: Account[]
    /** ISO Timestamp of when user was created */
    createdAt: string
    /* ISO Timestamp of when user was last updated */
    updatedAt?: string
}