import { ProviderString } from './ProviderString'
import { Currency } from './Currency'

export interface MessageInit {
    message: string;
    providerString: ProviderString;
    currency?: Currency
}