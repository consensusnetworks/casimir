import { BrowserProviders } from '@/interfaces/BrowserProviders'
export type ProviderString = keyof BrowserProviders | 'IoPay' | 'Phantom' | ''
