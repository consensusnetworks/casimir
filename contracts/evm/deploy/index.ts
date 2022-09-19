import { ethers } from 'hardhat'

async function main() {

  // Todo deploy deposit contract for development or setup env var HARDHAT_NETWORK

  const factory = await ethers.getContractFactory('PoolManager')
  const contract = await factory.deploy()

  await contract.deployed()

  console.log('Contract deployed to:', contract.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })