export interface User {
    /** Unique ID (and essential for auth verification) */
    address: string
    /** ISO Timestamp of when user was created */
    createdAt: string
    /** Unique user ID (and essential for auth verification) */
    id: number
    /* ISO Timestamp of when user was last updated */
    updatedAt?: string
}