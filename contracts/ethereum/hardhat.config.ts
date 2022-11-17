import localtunnel from 'localtunnel'
import os from 'os'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'
import { HardhatUserConfig } from 'hardhat/config'
import '@sebasgoldberg/hardhat-wsprovider'
import 'solidity-docgen'

const forkUrl = process.env.ETHEREUM_FORK_RPC
const mnemonic = process.env.BIP39_SEED

const hid = {
  mnemonic,
  count: 5
}

const compilerSettings = {
  optimizer: {
    enabled: true,
    runs: 10000
  }
}

// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.6.11',
        settings: { ...compilerSettings }
      },
      {
        version: '0.8.4',
        settings: { ...compilerSettings }
      },
      { 
        version: '0.8.16',
        settings: { ...compilerSettings }
      }
    ]
  },
  paths: {
    tests: './test',
    sources: './src',
    artifacts: './build/artifacts',
    cache: './build/cache'
  },
  typechain: {
    outDir: './build/artifacts/types',
  },
  networks: {
    hardhat: {
      accounts: mnemonic ? { ...hid, accountsBalance: '48000000000000000000' } : undefined,
      chainId: 1337,
      forking: forkUrl ? { url: forkUrl } : undefined,
      mining: {
        auto: false,
        interval: 12000
      }
    },
    geth: {
      url: 'http://localhost:51121',
      accounts: mnemonic ? { ...hid } : undefined
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