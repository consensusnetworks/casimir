import localtunnel from 'localtunnel'
import os from 'os'
import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-foundry'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import 'solidity-docgen'
import '@nomicfoundation/hardhat-toolbox'

// Seed is provided
const mnemonic = process.env.BIP39_SEED as string
const hid = { mnemonic, count: 10 }

// Mining interval is provided in seconds
const miningInterval = parseInt(process.env.MINING_INTERVAL as string)
const mining = { auto: false, interval: miningInterval * 1000 } // miningInterval in ms

// Live network rpc is provided with url and name
const hardhatUrl = process.env.ETHEREUM_RPC_URL as string
const hardhatNetwork = process.env.HARDHAT_NETWORK as string

// Local network fork rpc url overrides live network
const forkUrl = process.env.ETHEREUM_FORK_RPC_URL as string
const forkNetwork = forkUrl?.includes('mainnet') ? 'mainnet' : 'goerli'
const forkChainId = { mainnet: 1, goerli: 5 }[forkNetwork]
const forkConfig = { url: forkUrl, blockNumber: parseInt(process.env.ETHEREUM_FORK_BLOCK || '0') || undefined }

const externalEnv = {
  mainnet: {
    ORACLE_ADDRESS: '0x0000000000000000000000000000000000000000',
    BEACON_DEPOSIT_ADDRESS: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
    LINK_FUNCTIONS_ADDRESS: '0x0000000000000000000000000000000000000000',
    LINK_REGISTRAR_ADDRESS: '	0xDb8e8e2ccb5C033938736aa89Fe4fa1eDfD15a1d',
    LINK_REGISTRY_ADDRESS: '0x02777053d6764996e594c3E88AF1D58D5363a2e6',
    LINK_SUBSCRIPTION_ID: '1',
    LINK_TOKEN_ADDRESS: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    SSV_NETWORK_ADDRESS: '0x0000000000000000000000000000000000000000',
    SSV_NETWORK_VIEWS_ADDRESS: '0x0000000000000000000000000000000000000000',
    SSV_TOKEN_ADDRESS: '0x9D65fF81a3c488d585bBfb0Bfe3c7707c7917f54',
    SWAP_FACTORY_ADDRESS: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    SWAP_ROUTER_ADDRESS: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    WETH_TOKEN_ADDRESS: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  },
  goerli: {
    ORACLE_ADDRESS: '0x0000000000000000000000000000000000000000',
    BEACON_DEPOSIT_ADDRESS: '0x07b39F4fDE4A38bACe212b546dAc87C58DfE3fDC',
    LINK_FUNCTIONS_ADDRESS: '0x0000000000000000000000000000000000000000',
    LINK_REGISTRAR_ADDRESS: '0x57A4a13b35d25EE78e084168aBaC5ad360252467',
    LINK_REGISTRY_ADDRESS: '0xE16Df59B887e3Caa439E0b29B42bA2e7976FD8b2',
    LINK_TOKEN_ADDRESS: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
    SSV_NETWORK_ADDRESS: '0xAfdb141Dd99b5a101065f40e3D7636262dce65b3',
    SSV_NETWORK_VIEWS_ADDRESS: '0x8dB45282d7C4559fd093C26f677B3837a5598914',
    SSV_TOKEN_ADDRESS: '0x3a9f01091C446bdE031E39ea8354647AFef091E7',
    SWAP_FACTORY_ADDRESS: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    SWAP_ROUTER_ADDRESS: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    WETH_TOKEN_ADDRESS: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
  }
} 

const network = forkNetwork || hardhatNetwork
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
const compilerVersions = ['0.8.18']
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
      accounts: mnemonic ? hid : undefined,
      chainId: forkChainId || 1337,
      forking: forkUrl ? forkConfig : undefined,
      mining: miningInterval ? mining : { auto: true },
      allowUnlimitedContractSize: true,
      gas: 'auto',
      gasPrice: 'auto'
    },
    mainnet: {
      accounts: mnemonic ? hid : undefined,
      url: hardhatUrl || '',
      allowUnlimitedContractSize: true,
      gas: 'auto',
      gasPrice: 'auto'
    },
    goerli: {
      accounts: mnemonic ? hid : undefined,
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

// Start a local tunnel for using RPC over https (e.g. for Metamask on mobile)
if (process.env.TUNNEL === 'true') {
  const localSubdomain = `local-hardhat-${os.userInfo().username.toLowerCase()}`
  const localUrl = `https://${localSubdomain}.loca.lt`
  localtunnel({ port: 8545, subdomain: localSubdomain }).then(
    (tunnel: localtunnel.Tunnel) => {
      if (localUrl === tunnel.url) {
        console.log('Your default local tunnel url is', localUrl)
      } else {
        console.log('Your default local tunnel url is not available, use', tunnel.url, 'instead')
      }
      process.on('SIGINT', () => {
        tunnel.close()
      })
    }
  )
}

export default config