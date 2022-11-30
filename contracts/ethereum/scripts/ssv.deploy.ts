import { deployContract } from '@casimir/hardhat-helpers'

void async function () {
    const name = 'SSVManager'
    const args = {
        LINKTokenAddress: process.env.LINK_TOKEN_ADDRESS,
        SSVTokenAddress: process.env.SSV_TOKEN_ADDRESS,
        WETHTokenAddress: process.env.WETH_TOKEN_ADDRESS
    }
    const options = {}
    const proxy = false
    const { address } = await deployContract(name, proxy, args, options)
    console.log(`${name} contract deployed to ${address}`)
    process.exit(0)
}()