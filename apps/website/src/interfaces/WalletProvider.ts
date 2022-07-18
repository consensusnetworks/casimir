import { ExternalProvider } from '@ethersproject/providers'

export interface WalletProvider extends ExternalProvider {
  isCoinbaseWallet?: boolean
}
