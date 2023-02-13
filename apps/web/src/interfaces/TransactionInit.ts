import ethers from 'ethers'
import { ProviderString } from '@casimir/types'
import { Currency } from '@casimir/types'

export interface TransactionInit extends ethers.providers.TransactionRequest {
    /** The transaction sender's address */
    from: string;
    /** The transaction receiver's address */
    to: string;
    /** The value of the transaction */
    value: string;
    /** The provider string of the transaction */
    providerString: ProviderString;
    /** The token of the transaction */
    token?: Currency
}