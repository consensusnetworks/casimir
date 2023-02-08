import { ProviderString } from '../types/ProviderString'

export interface LoginCredentials {
    address: string;
    message: string;
    signedMessage: string;
    provider: ProviderString;
}