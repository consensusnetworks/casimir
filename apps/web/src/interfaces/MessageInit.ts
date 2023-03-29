import { Currency, ProviderString } from '@casimir/types'

export interface MessageInit {
    message: string;
    providerString: ProviderString;
    currency?: Currency
}