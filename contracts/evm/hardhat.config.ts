import localtunnel from 'localtunnel'
import os from 'os'
import { task } from 'hardhat/config'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'
import { HardhatUserConfig } from 'hardhat/config'

// https://hardhat.org/guides/create-task.html
task(
  'accounts',
  'Prints the list of accounts',
  async (taskArgs: any, hre: { ethers: { getSigners: () => any } }) => {
    const accounts = await hre.ethers.getSigners()

    for (const account of accounts) {
      console.log(account.address)
    }
  }
)

// Use Ledger seed for consistency from localnet to testnet
const defaultSeed =
  'test test test test test test test test test test test junk'
const mnemonic = process.env.LEDGER_SEED || defaultSeed

// Get fork RPC url if provided
const forkUrl = process.env.FORK_URL

// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: '0.8.17',
  paths: {
    tests: './test',
    sources: './src',
    artifacts: './build/artifacts',
    cache: './build/cache',
  },
  typechain: {
    outDir: './build/artifacts/types',
  },
  networks: {
    hardhat: {
      accounts: { mnemonic, accountsBalance: '32000000000000000000' },
      chainId: 1337,
      forking: forkUrl ? { url: forkUrl } : undefined,
    },
  },
}

if (process.env.LOCAL_DEV) {
  console.log('Your mnemonic is', mnemonic)

  // Start a local tunnel for using RPC over https
  const localSubdomain = `cn-hh-${os.userInfo().username.toLowerCase()}`
  const localUrl = `https://${localSubdomain}.loca.lt`
  console.log('Your local tunnel is', localUrl)
  localtunnel({ port: 8545, subdomain: localSubdomain }).then(
    (tunnel: localtunnel.Tunnel) => {
      if (localUrl === tunnel.url) {
        console.log('Your local tunnel is now available at', localUrl)
      } else {
        console.log('Your desired local tunnel url is not available')
      }
      process.on('SIGINT', () => {
        tunnel.close()
        process.exit(0)
      })
    }
  )
}

export default config
