import { ethers } from "ethers"

export interface FactoryOptions {
    ethereumUrl?: string
    provider?: ethers.providers.JsonRpcProvider
    uniswapV3FactoryAddress: string
}