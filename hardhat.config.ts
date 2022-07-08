import { task } from 'hardhat/config'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'
import { HardhatUserConfig } from 'hardhat/config'

// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: '0.8.4',
  paths: {
    tests: './scripts/hardhat/test',
    sources: './contracts/src',
    artifacts: './contracts/build/artifacts',
    cache: './contracts/build/cache'
  },
  typechain: {
    outDir: './contracts/build/artifacts/types'
  }
}

export default config