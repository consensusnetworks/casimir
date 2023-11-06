import { BrowserProviders } from "./BrowserProviders"
export type ProviderString =
  | keyof BrowserProviders
  | "IoPay"
  | "Ledger"
  | "Trezor"
  | "WalletConnect"
  |  "Phantom"
  | ""