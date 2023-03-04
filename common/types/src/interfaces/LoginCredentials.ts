import { Currency } from '@casimir/types'
import { ProviderString } from '@casimir/types'

export interface LoginCredentials {
    address: string
    provider: ProviderString
    currency?: Currency
    message: string
    signedMessage: string
}