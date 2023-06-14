import { ethers } from 'ethers'

export interface PriceInput {
    /** JSON RPC node provider */
    provider: ethers.providers.JsonRpcProvider
    /** The input token */
    tokenIn: string
    /** The output token */
    tokenOut: string
    /** The fee tier of the pool */
    uniswapFeeTier: number
}