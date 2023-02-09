import { ProviderString } from '@/types/ProviderString'
import { Currency } from './TokenString'

export interface MessageInit {
    message: string;
    providerString: ProviderString;
    token?: Currency
}