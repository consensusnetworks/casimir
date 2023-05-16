import { BalanceSnapshot } from './BalanceSnapshot'
import { ProviderString } from './ProviderString'
import { Currency } from './Currency'
import { Pool } from './Pool'

export interface Account {
    /** Unique ID (only keeping the latest of each distinct address/currency pair per User to avoid double counting) */
    address: string
    /** The current balance */
    balance?: string
    /** Daily balance snapshots */
    balanceSnapshots?: BalanceSnapshot[]
    /** See Currency below */
    currency: Currency
    /** The user's current staking pools and details (this interface/logic is in the web app wallet composable, but it will be moved to the processor, see https://github.com/consensusnetworks/casimir/blob/master/apps/web/src/composables/wallet.ts#L146) */
    pools?: Pool[]
    /** The total amount of stake rewards available to withdraw (ignore for now, see note on Account.pools) */
    rewards?: string
    /** Return on investment rate (see https://github.com/consensusnetworks/casimir/issues/168#issuecomment-1314420917) */
    roi?: number
    /** The total amount currently staked (ignore for now, see note on Account.pools) */
    stake?: string
    /** The wallet provider which helps us show user breakdown and connect when signing or sending TXs */
    walletProvider: ProviderString
    /** The verified user owner address (only optional for compat, should be req) */
    ownerAddress?: string
}