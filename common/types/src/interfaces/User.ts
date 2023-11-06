import { ProviderString } from "@casimir/types"

export interface User {
    /* Unique ID (and essential for auth verification) */
    address: string
    /* ISO Timestamp of when user was created */
    createdAt: string
    /* Unique user ID (and essential for auth verification) */
    id: number
    /* ISO Timestamp of when user was last updated */
    updatedAt?: string
    /* Did user agree to terms of service? */
    agreedToTermsOfService: boolean
    /* Wallet provider (e.g. metamask) */
    walletProvider: ProviderString
}