import hre from 'hardhat'
import { PoolManager } from '@casimir/evm/build/artifacts/types'
const { ethers } = hre
// Todo get deposit address from fork or deploy
const depositAddress = '0x00000000219ab540356cBB839Cbe05303d7705Fa'

async function main() {
  const factory = await ethers.getContractFactory('PoolManager')
  const contract = await factory.deploy(depositAddress) as PoolManager
  await contract.deployed()
  console.log('Contract deployed to:', contract.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })