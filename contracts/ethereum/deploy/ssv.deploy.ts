import hre from 'hardhat'
import { SSVManager } from '@casimir/ethereum/build/artifacts/types'
const { ethers } = hre

async function main() {
  const factory = await ethers.getContractFactory('SSVManager')
  const contract = await factory.deploy() as SSVManager
  await contract.deployed()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })