import { ethers } from 'hardhat'

async function main() {

  const Sample = await ethers.getContractFactory('Sample')
  const sample = await Sample.deploy('Hello, Hardhat!')

  await sample.deployed()

  console.log('Sample deployed to:', sample.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })