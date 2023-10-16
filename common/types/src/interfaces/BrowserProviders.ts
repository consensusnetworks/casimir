import { EthersProvider } from "./EthersProvider"

// TODO: Add other browser providers here and set their types accordingly?? (BraveWallet, TrustWallet)
export interface BrowserProviders {
  BraveWallet?: EthersProvider
  CoinbaseWallet?: EthersProvider
  MetaMask?: EthersProvider
  OkxWallet?: EthersProvider
  TrustWallet?: EthersProvider
  Phantom?: any
}
