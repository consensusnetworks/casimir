import { AccountWithStakingInfo } from '@casimir/types'

export interface UserWithAccounts {
    /** Unique address for the user (can be updated) */
    address: string
    /** An array of the user's accounts */
    accounts: AccountWithStakingInfo[]
    /** ISO Timestamp of when user was created */
    createdAt: string
    /** Unique user ID (and essential for auth verification) */
    id: number
    /* ISO Timestamp of when user was last updated */
    updatedAt?: string
}