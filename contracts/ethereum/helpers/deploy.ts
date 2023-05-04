import { ethers, upgrades } from 'hardhat'

async function deployContract(name: string, proxy?: boolean, args?: Record<string, any>, options?: Record<string, any>) {
    if (!args) args = {}
    if (!options) options = {}
    const inputs = []
    const factory = await ethers.getContractFactory(name)
    if (proxy) {
        if (Object.keys(args).length) inputs.push([...Object.values(args)])
        if (Object.keys(options).length) inputs.push(options)
        const proxy = await upgrades.deployProxy(factory, ...inputs)
        return await proxy.deployed()
    } else {
        if (Object.keys(args).length) inputs.push(...Object.values(args))
        if (Object.keys(options).length) inputs.push(options)
        const contract = await factory.deploy(...inputs)
        return await contract.deployed()
    }
}

export { deployContract }