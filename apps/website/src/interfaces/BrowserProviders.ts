import { EthersProvider } from '@/interfaces/EthersProvider'

export interface BrowserProviders {
  MetaMask?: EthersProvider
  CoinbaseWallet?: EthersProvider
  Phantom?: any // TODO: Fix this
  Keplr?: any // TODO: Fix this
}
