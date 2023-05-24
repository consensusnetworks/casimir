import { Currency, ProviderString } from '@casimir/types'

export interface MessageRequest {
    message: string;
    providerString: ProviderString;
    currency?: Currency
}