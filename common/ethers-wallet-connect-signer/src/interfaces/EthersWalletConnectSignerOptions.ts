import { ethers } from 'ethers'

export interface EthersWalletConnectSignerOptions {
    provider?: ethers.providers.Provider
    baseURL?: string
}