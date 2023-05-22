import ethers from 'ethers'

export interface TransactionRequest extends ethers.providers.TransactionRequest {
    /** The transaction sender's address */
    from: string;
    /** The transaction receiver's address */
    to: string;
    /** The value of the transaction */
    value: string;
}