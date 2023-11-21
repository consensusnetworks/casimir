import { AccountWithStakingAndOperatorInfo, Operator, User } from "@casimir/types"

export interface UserWithAccountsAndOperators extends User {
    /** An array of the user's accounts */
    accounts: AccountWithStakingAndOperatorInfo[]
    /** An array of the user's operators */
    operators?: Operator[]
}