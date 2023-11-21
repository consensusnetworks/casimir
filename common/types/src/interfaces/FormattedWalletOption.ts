import { ProviderString } from "./ProviderString"

export interface FormattedWalletOption {
    provider: ProviderString,
    addresses: string[],
}