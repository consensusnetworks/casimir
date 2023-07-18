export interface PriceInput {
    /** The input token */
    tokenIn: string
    /** The output token */
    tokenOut: string
    /** The fee tier of the pool */
    uniswapFeeTier: number
}