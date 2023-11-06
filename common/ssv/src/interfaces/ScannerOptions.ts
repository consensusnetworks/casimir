import { ethers } from "ethers"

export interface ScannerOptions {
    ethereumUrl?: string
    provider?: ethers.providers.JsonRpcProvider
    ssvNetworkAddress: string
    ssvViewsAddress: string
}