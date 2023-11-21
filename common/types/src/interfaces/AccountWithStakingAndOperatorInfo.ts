import { Account, Operator, PoolConfig } from "@casimir/types"

export interface AccountWithStakingAndOperatorInfo extends Account {
    /** The user's current staking pools and details (this interface/logic is in the web app wallet composable, but it will be moved to the processor, see https://github.com/consensusnetworks/casimir/blob/master/apps/web/src/composables/wallet.ts#L146) */
    pools?: PoolConfig[]
    /** The total amount of stake rewards available to withdraw (ignore for now, see note on Account.pools) */
    rewards?: string
    /** Return on investment rate (see https://github.com/consensusnetworks/casimir/issues/168#issuecomment-1314420917) */
    roi?: number
    /** The total amount currently staked (ignore for now, see note on Account.pools) */
    stake?: string
    /** Operators associated with a given account address */
    operators?: Operator[]
}