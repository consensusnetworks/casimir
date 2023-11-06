import { ProviderString } from "./ProviderString"
import { Currency } from "./Currency"

export interface MessageRequest {
    message: string;
    providerString: ProviderString;
    currency?: Currency
}