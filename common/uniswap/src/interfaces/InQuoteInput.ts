import { ethers } from "ethers"

export interface InQuoteInput {
    tokenIn: string
    tokenOut: string
    feeTier: number
    amountIn: ethers.BigNumber
}