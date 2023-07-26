import { ethers } from 'ethers'
import { FactoryOptions } from '../interfaces/FactoryOptions'
import { PriceInput } from '../interfaces/PriceInput'
import IUniswapV3FactoryJson from '@casimir/ethereum/build/artifacts/@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json'
import IUniswapV3PoolStateJson from '@casimir/ethereum/build/artifacts/@uniswap/v3-core/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json'
import { IUniswapV3Factory, IUniswapV3PoolState } from '@casimir/ethereum/build/artifacts/types'

export class Factory {
    provider: ethers.providers.JsonRpcProvider
    uniswapV3Factory: IUniswapV3Factory & ethers.Contract

    constructor(options: FactoryOptions) {
        if (options.provider) {
            this.provider = options.provider
        } else {
            this.provider = new ethers.providers.JsonRpcProvider(options.ethereumUrl)
        }
        this.uniswapV3Factory = new ethers.Contract(options.uniswapV3FactoryAddress, IUniswapV3FactoryJson.abi, this.provider) as IUniswapV3Factory & ethers.Contract
    }

    /** 
     * Get the swap price for a given token pair
     * @param {PriceInput} input - Token in, token out, and uniswap fee tier
     * @returns {Promise<number>} Swap price
     */
    getSwapPrice = async (input: PriceInput): Promise<number> => {
        const { tokenIn, tokenOut, uniswapFeeTier } = input
        const poolAddress = await this.uniswapV3Factory.getPool(tokenIn, tokenOut, uniswapFeeTier)
        const poolContract = new ethers.Contract(poolAddress, IUniswapV3PoolStateJson.abi, this.provider) as IUniswapV3PoolState & ethers.Contract
        const slot0 = await poolContract.slot0()
        const tick = slot0.tick
        return 1.0001 ** tick
    }
}