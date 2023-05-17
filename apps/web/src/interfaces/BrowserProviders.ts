import { EthersProvider } from '@/interfaces/EthersProvider'

// TODO: Add other browser providers here and set their types accordingly?? (BraveWallet, TrustWallet)
export interface BrowserProviders {
  MetaMask?: EthersProvider
  CoinbaseWallet?: EthersProvider
  Phantom?: any // TODO: Fix this.
}
