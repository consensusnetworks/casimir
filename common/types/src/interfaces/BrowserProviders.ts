import { EthersProvider } from './EthersProvider'

export interface BrowserProviders {
  MetaMask?: EthersProvider
  CoinbaseWallet?: EthersProvider
  Phantom?: any // TODO: Fix this.
}
