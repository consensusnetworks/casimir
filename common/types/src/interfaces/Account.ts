import { BalanceSnapshot } from "./BalanceSnapshot"
import { ProviderString } from "./ProviderString"
import { Currency } from "./Currency"

export interface Account {
    /** The address of the current account */
    address: string
    /** The current balance */
    balance?: number
    /** See Currency below */
    currency: Currency
    /** ISO Timestamp of when user was created */
    createdAt: string
    /** The unique account id */
    id: number
    /** The account snapshots */
    // snapshots?: BalanceSnapshot[]
    /** The account transactions */
    // transactions?: Transaction[]
    /** The pathIndex of the user's HD Wallet */
    pathIndex?: number
    /** The user id associated with the account */
    userId: string
    /** The wallet provider which helps us show user breakdown and connect when signing or sending TXs */
    walletProvider: ProviderString
}