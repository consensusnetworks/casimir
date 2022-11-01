import localtunnel from 'localtunnel'
import os from 'os'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'
import { HardhatUserConfig } from 'hardhat/config'
import 'solidity-docgen'

const forkUrl = process.env.ETHEREUM_FORK_RPC
const mnemonic = process.env.BIP39_SEED

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
      accounts: mnemonic ? { mnemonic, accountsBalance: '48000000000000000000', count: 3 } : undefined,
      chainId: 1337,
      forking: forkUrl ? { url: forkUrl } : undefined,
      mining: {
        auto: false,
        interval: 1000
      }
    }
  }
}

if (process.env.LOCAL_TUNNEL && process.env.HARDHAT_NETWORK !== 'localhost') {
  // Start a local tunnel for using RPC over https
  const localSubdomain = `cn-hardhat-${os.userInfo().username.toLowerCase()}`
  const localUrl = `https://${localSubdomain}.loca.lt`
  localtunnel({ port: 8545, subdomain: localSubdomain }).then(
    (tunnel: localtunnel.Tunnel) => {
      if (localUrl === tunnel.url) {
        console.log('Your local tunnel is now available at', localUrl)
      } else {
        console.log('Your default local tunnel url is not available, instead use', tunnel.url)
      }
      process.on('SIGINT', () => {
        tunnel.close()
        process.exit(0)
      })
    }
  )
}

export default config