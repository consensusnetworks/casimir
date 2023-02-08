import { Currency } from '../types/Currency'
import { ProviderString } from '../types/ProviderString'

export interface SignupCredentials {
    address: string;
    provider: ProviderString;   
    token: Currency
}