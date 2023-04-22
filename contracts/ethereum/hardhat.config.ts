import localtunnel from 'localtunnel'
import os from 'os'
import { HardhatUserConfig } from 'hardhat/config'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import 'solidity-docgen'
import '@openzeppelin/hardhat-upgrades'

// Seed is provided
const mnemonic = process.env.BIP39_SEED as string
const hid = { mnemonic, count: 10 }

// Mining interval is provided
const miningInterval = parseInt(process.env.MINING_INTERVAL as string)
const mining = { auto: false, interval: miningInterval * 1000 } // miningInterval in ms

// Live network rpc is provided 
const hardhatUrl = process.env.PUBLIC_ETHEREUM_URL as string
const hardhatNetwork = process.env.HARDHAT_NETWORK as string

// Local network fork rpc is provided
const forkingUrl = process.env.ETHEREUM_FORKING_URL as string
const forkingNetwork = forkingUrl?.includes('mainnet') ? 'mainnet' : 'goerli'
const forkingChainId = { mainnet: 1, goerli: 5 }[forkingNetwork]

const externalEnv = {
  mainnet: {
    BEACON_DEPOSIT_ADDRESS: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
    LINK_FEED_ADDRESS: '',
    LINK_TOKEN_ADDRESS: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    SSV_NETWORK_ADDRESS: '',
    SSV_TOKEN_ADDRESS: '0x9D65fF81a3c488d585bBfb0Bfe3c7707c7917f54',
    SWAP_FACTORY_ADDRESS: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    SWAP_ROUTER_ADDRESS: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    WETH_TOKEN_ADDRESS: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  },
  goerli: {
    BEACON_DEPOSIT_ADDRESS: '0x07b39F4fDE4A38bACe212b546dAc87C58DfE3fDC',
    LINK_FEED_ADDRESS: '0x3de1bE9407645533CD0CbeCf88dFE5297E7125e6',
    LINK_TOKEN_ADDRESS: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
    SSV_NETWORK_ADDRESS: '0xb9e155e65B5c4D66df28Da8E9a0957f06F11Bc04',
    SSV_TOKEN_ADDRESS: '0x3a9f01091C446bdE031E39ea8354647AFef091E7',
    SWAP_FACTORY_ADDRESS: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    SWAP_ROUTER_ADDRESS: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    WETH_TOKEN_ADDRESS: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
  }
} 

const network = forkingNetwork || hardhatNetwork
if (network) {
  const args = externalEnv[network]
  for (const key in args) {
    process.env[key] = args[key as keyof typeof args]
  }
}

const compilerSettings = {
  optimizer: {
    enabled: true,
    runs: 1
  }
}
const compilerVersions = ['0.8.16']
const externalCompilerVersions = ['0.4.22', '0.4.24', '0.6.6', '0.6.11', '0.8.4']
const compilers = [...compilerVersions, ...externalCompilerVersions].map(version => ({ version, settings: compilerSettings }))

// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: {
    compilers
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
      accounts: mnemonic ? { ...hid, accountsBalance: '96000000000000000000' } : undefined,
      chainId: forkingChainId || 1337,
      forking: forkingUrl ? { url: forkingUrl } : undefined,
      mining: miningInterval ? mining : { auto: true },
      allowUnlimitedContractSize: true,
      gas: 'auto',
      gasPrice: 'auto'
    },
    ganache: {
      accounts: mnemonic ? { ...hid } : undefined,
      url: 'http://127.0.0.1:8545',
      allowUnlimitedContractSize: true,
      gas: 'auto',
      gasPrice: 'auto'
    },
    mainnet: {
      accounts: mnemonic ? { ...hid } : undefined,
      url: hardhatUrl || '',
      allowUnlimitedContractSize: true,
      gas: 'auto',
      gasPrice: 'auto'
    },
    goerli: {
      accounts: mnemonic ? { ...hid } : undefined,
      url: hardhatUrl || '',
      allowUnlimitedContractSize: true,
      gas: 'auto',
      gasPrice: 'auto'
    }
  },
  mocha: {
    timeout: 250000 // Default timeout * 10
  }
}

if (process.env.LOCAL_TUNNEL) {
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