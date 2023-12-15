import { ethers } from "ethers"
import { SwapOptions } from "../interfaces/SwapOptions"
import { InQuoteInput } from "../interfaces/InQuoteInput"
import { OutQuoteInput } from "../interfaces/OutQuoteInput"
import ISwapQuoterAbi from "@casimir/ethereum/build/abi/ISwapQuoter.json"
import { ISwapQuoter } from "@casimir/ethereum/build/@types"
import { DETERMINED_ETHEREUM_CONTRACTS } from "@casimir/env"

export class Swap {
    provider: ethers.providers.JsonRpcProvider
    quoter: ISwapQuoter

    constructor(options: SwapOptions) {
        if (options.provider) {
            this.provider = options.provider
        } else {
            this.provider = new ethers.providers.JsonRpcProvider(options.ethereumUrl)
        }
        this.quoter = new ethers.Contract(
            DETERMINED_ETHEREUM_CONTRACTS.SWAP_QUOTER_ADDRESS,
            ISwapQuoterAbi,
            this.provider
        ) as ISwapQuoter
    }

    /** 
     * Get a swap quote for a given token pair, fee tier, and amount in
     * @param {InQuoteInput} input - Token in, token out, and uniswap fee tier
     * @returns {Promise<ethers.BigNumber>} Swap price
     */
    getInQuote = async (input: InQuoteInput): Promise<ethers.BigNumber> => {
        const { tokenIn, tokenOut, feeTier, amountIn } = input
        return await this.quoter.callStatic.quoteExactInputSingle(
            tokenIn,
            tokenOut,
            feeTier,
            amountIn,
            0
        )
    }

    /** 
     * Get a swap quote for a given token pair, fee tier, and amount out
     * @param {OutQuoteInput} input - Token in, token out, and uniswap fee tier
     * @returns {Promise<ethers.BigNumber>} Swap price
     */
    getOutQuote = async (input: OutQuoteInput): Promise<ethers.BigNumber> => {
        const { tokenIn, tokenOut, feeTier, amountOut } = input
        return await this.quoter.callStatic.quoteExactOutputSingle(
            tokenIn,
            tokenOut,
            feeTier,
            amountOut,
            0
        )
    }
}