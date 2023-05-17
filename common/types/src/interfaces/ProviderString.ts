import { BrowserProviders } from '@/interfaces/index'
export type ProviderString =
  | keyof BrowserProviders
  | 'BraveWallet'
  | 'IoPay'
  | 'Ledger'
  | 'Trezor'
  | 'TrustWallet'
  | 'WalletConnect'
  |  'Phantom'
  | ''
