import { ExternalProvider } from "@ethersproject/providers"

export interface EthersProvider extends ExternalProvider {
  isCoinbaseWallet?: boolean
}
