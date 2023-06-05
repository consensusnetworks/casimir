import { ethers } from 'ethers'
import { PriceInput } from '../interfaces/PriceInput'
import IUniswapV3FactoryJson from '@casimir/ethereum/build/artifacts/@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json'
import IUniswapV3PoolStateJson from '@casimir/ethereum/build/artifacts/@uniswap/v3-core/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json'
import { IUniswapV3Factory, IUniswapV3PoolState } from '@casimir/ethereum/build/artifacts/types'

const uniswapV3FactoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984'

export async function getPrice(input: PriceInput) {
    const { provider, tokenIn, tokenOut, uniswapFeeTier } = input
    const uniswapV3FactoryContract = new ethers.Contract(uniswapV3FactoryAddress, IUniswapV3FactoryJson.abi, provider) as IUniswapV3Factory & ethers.Contract
    const poolAddress = await uniswapV3FactoryContract.getPool(tokenIn, tokenOut, uniswapFeeTier)
    const poolContract = new ethers.Contract(poolAddress, IUniswapV3PoolStateJson.abi, provider) as IUniswapV3PoolState & ethers.Contract
    const slot0 = await poolContract.slot0()
    const tick = slot0.tick
    return 1.0001 ** tick
}