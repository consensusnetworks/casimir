import { BrowserProviders } from '@/interfaces/index'
export type ProviderString =
  | keyof BrowserProviders
  | 'IoPay'
  | 'Ledger'
  | 'Trezor'
  | 'WalletConnect'
  |  'Phantom'
  | ''
