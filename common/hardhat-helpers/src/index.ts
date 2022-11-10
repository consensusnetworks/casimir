import { ethers } from 'hardhat'

export interface IDeployContractOptions {
    test: string
}

async function deployContract(name: string, options?: IDeployContractOptions) {
    console.log(options)
    const factory = await ethers.getContractFactory(name)
    const contract = await factory.deploy()
    return await contract.deployed()
}

export { deployContract }
