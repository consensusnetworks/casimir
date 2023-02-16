import { ProviderString } from '@casimir/types'

export interface LoginCredentials {
    address: string;
    message: string;
    signedMessage: string;
    provider: ProviderString;
}