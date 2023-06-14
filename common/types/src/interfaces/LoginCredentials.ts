import { Currency } from './Currency'
import { ProviderString } from './ProviderString'

export interface LoginCredentials {
    address: string
    provider: ProviderString
    currency: Currency
    message: string
    signedMessage: string
}