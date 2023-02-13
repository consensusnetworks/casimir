import { ProviderString } from '@casimir/types'
import { Currency } from '@casimir/types'

export interface MessageInit {
    message: string;
    providerString: ProviderString;
    token?: Currency
}