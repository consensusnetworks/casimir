import { ethers } from "ethers"

export interface OutQuoteInput {
    tokenIn: string
    tokenOut: string
    feeTier: number
    amountOut: ethers.BigNumber
}