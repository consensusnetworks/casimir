export interface BalanceSnapshot {
    /** YYYY-MM-DD from yesterday to 100 days ago */
    date: string
    /** The balance amount (in base unit i.e., WEI) */
    balance: string
}