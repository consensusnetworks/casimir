import { ethers } from 'ethers'

export interface EthersLedgerSignerOptions {
    provider?: ethers.providers.Provider
    type?: string
    path?: string
    baseURL?: string
}