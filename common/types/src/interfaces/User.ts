export interface User {
    /** Unique ID (and essential for auth verification) */
    address: string
    /** TODO: Revisit with Howie User's account (front-end only) */
    accounts?: string[]
    /** ISO Timestamp of when user was created */
    createdAt: string
    /* ISO Timestamp of when user was last updated */
    updatedAt?: string
}