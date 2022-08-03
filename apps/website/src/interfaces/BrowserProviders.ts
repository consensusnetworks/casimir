import { EthersProvider } from '@/interfaces/EthersProvider'

export type BrowserProviderString = 'MetaMask' | 'CoinbaseWallet'

export type BrowserProviders = {
  MetaMask?: EthersProvider
  CoinbaseWallet?: EthersProvider
}
