export interface RemoveAccountOptions {
    /* The primary key of account table */
    address: string
    /* The user's primary address */
    ownerAddress: string
    /* The walletProvider associated with this account */
    walletProvider: string
    /* The currency associated with the account being removed */
    currency: string
}