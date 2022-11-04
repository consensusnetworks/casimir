import { ethers } from 'ethers'

export interface EthersTrezorSignerOptions {
    provider?: ethers.providers.Provider
    path?: string
}