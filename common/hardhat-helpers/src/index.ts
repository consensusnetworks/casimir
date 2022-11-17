import { ethers } from 'hardhat'

async function deployContract(name: string) {
    const factory = await ethers.getContractFactory(name)
    const contract = await factory.deploy()
    return await contract.deployed()
}

export { deployContract }
