import { deployContract } from '@casimir/hardhat-helpers'

void async function () {
    const name = 'SSVManager'
    const args = {
        swapRouterAddress: process.env.SWAP_ROUTER_ADDRESS,
        linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
        ssvTokenAddress: process.env.SSV_TOKEN_ADDRESS,
        wethTokenAddress: process.env.WETH_TOKEN_ADDRESS
    }
    const options = {}
    const proxy = false
    const { address } = await deployContract(name, proxy, args, options)
    console.log(`${name} contract deployed to ${address}`)
    process.exit(0)
}()