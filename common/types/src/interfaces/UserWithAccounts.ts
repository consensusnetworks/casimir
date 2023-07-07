import { AccountWithStakingInfo, User } from '@casimir/types'

export interface UserWithAccounts extends User {
    /** An array of the user's accounts */
    accounts: AccountWithStakingInfo[]
}