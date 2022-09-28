import hre from 'hardhat'
import { SSVManager } from '@casimir/evm/build/artifacts/types'
const { ethers } = hre

async function main() {
  const factory = await ethers.getContractFactory('SSVManager')
  const contract = await factory.deploy() as SSVManager
  await contract.deployed()
  console.log('Contract deployed to:', contract.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })