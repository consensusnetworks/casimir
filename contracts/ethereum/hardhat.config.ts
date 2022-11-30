import localtunnel from 'localtunnel'
import os from 'os'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'
import { HardhatUserConfig } from 'hardhat/config'
import '@sebasgoldberg/hardhat-wsprovider'
import 'solidity-docgen'
import '@openzeppelin/hardhat-upgrades'

const forkUrl = process.env.ETHEREUM_FORK_URL
const network = forkUrl?.includes('mainnet') ? 'mainnet' : forkUrl?.includes('goerli') ? 'goerli' : 'localhost'
const env = {
  mainnet: {
    linkTokenAddress: '',
    ssvTokenAddress: '',
    wethTokenAddress: ''
  },
  goerli: {
    linkTokenAddress: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
    ssvTokenAddress: '0x3a9f01091C446bdE031E39ea8354647AFef091E7',
    wethTokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  }
} 

const httpUrl = `http://localhost:${process.env.ETHEREUM_EXECUTION_HTTP_PORT}`
const mnemonic = process.env.BIP39_SEED

const hid = {
  mnemonic,
  count: 5
}

const compilerSettings = {
  optimizer: {
    enabled: true,
    runs: 1
  }
}

const miningInterval = {
  auto: false,
  interval: 12000
}

const compilerVersions = ['0.8.16', '0.4.22', '0.6.11', '0.8.4']
// const externalCompilerVersions = ['0.4.22', '0.6.11', '0.8.4']
// if () {

// }


// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      ...compilerVersions.map(version => ({ version, settings: compilerSettings })),

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
      mining: process.env.INTERVAL_MINING ? miningInterval : undefined,
      allowUnlimitedContractSize: true,
      gas: 'auto',
      gasPrice: 'auto'
    },
    geth: {
      url: httpUrl || 'http://localhost:8545',
      accounts: mnemonic ? { ...hid } : undefined,
      allowUnlimitedContractSize: true,
      gas: 'auto',
      gasPrice: 'auto'
    }
  },
  mocha: {
    timeout: 250000 // Default timeout * 10
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