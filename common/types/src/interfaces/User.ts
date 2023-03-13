import { Account } from '@casimir/types'
import { Pool } from '../interfaces/Pool'

export interface User {
    /** Unique ID (and essential for auth verification) */
    address: string
    /** Wallet portfolio accounts */
    accounts?: Account[]
    /** A message that is returned to front-end for signing and login */
    nonce: string
    /** User's pools */
    pools: Pool[]
}