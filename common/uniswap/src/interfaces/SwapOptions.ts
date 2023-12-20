import { ethers } from "ethers"

export interface SwapOptions {
    ethereumUrl?: string
    provider?: ethers.providers.JsonRpcProvider
}