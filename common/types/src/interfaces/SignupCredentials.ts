import { Currency } from '@casimir/types'
import { ProviderString } from '@casimir/types'

export interface SignupCredentials {
    address: string;
    provider: ProviderString;   
    token: Currency
}