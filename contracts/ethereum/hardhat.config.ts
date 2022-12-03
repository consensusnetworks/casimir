import localtunnel from 'localtunnel'
import os from 'os'
import { HardhatUserConfig, task } from 'hardhat/config'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-ethers'
import '@sebasgoldberg/hardhat-wsprovider'
import 'solidity-docgen'
import '@openzeppelin/hardhat-upgrades'
import { ethers } from 'ethers'

const intervalMining = process.env.INTERVAL_MINING === 'true'
const hardhatUrl = process.env.PUBLIC_ETHEREUM_URL as string
const hardhatNetwork = process.env.HARDHAT_NETWORK as string
const forkingUrl = process.env.ETHEREUM_FORKING_URL as string
const forkingNetwork = forkingUrl?.includes('mainnet') ? 'mainnet' : 'goerli'
const forkingChainId = { mainnet: 1, goerli: 5 }[forkingNetwork]

if (!hardhatUrl && hardhatNetwork && hardhatNetwork !== 'hardhat' && hardhatNetwork !== 'localhost') {
  console.log('Set a PUBLIC_ETHEREUM_URL when using the non-default hardhat network.')
  process.exit(0)
} else {
  console.log('HARDHAT_NETWORK', hardhatNetwork)
}

const externalEnv = {
  mainnet: {
    LINK_ORACLE_ADDRESS: '',
    SWAP_ROUTER_ADDRESS: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    LINK_TOKEN_ADDRESS: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    SSV_TOKEN_ADDRESS: '0x9D65fF81a3c488d585bBfb0Bfe3c7707c7917f54',
    WETH_TOKEN_ADDRESS: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  },
  goerli: {
    LINK_ORACLE_ADDRESS: '0xCC79157eb46F5624204f47AB42b3906cAA40eaB7',
    SWAP_ROUTER_ADDRESS: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    LINK_TOKEN_ADDRESS: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
    SSV_TOKEN_ADDRESS: '0x3a9f01091C446bdE031E39ea8354647AFef091E7',
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

const mnemonic = process.env.BIP39_SEED as string
const hid = {
  mnemonic,
  count: 5
}

const miningInterval = {
  auto: false,
  interval: 12000
}

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
      accounts: mnemonic ? { ...hid, accountsBalance: '48000000000000000000' } : undefined,
      chainId: forkingChainId || 1337,
      forking: forkingUrl ? { url: forkingUrl } : undefined,
      mining: intervalMining ? miningInterval : undefined,
      allowUnlimitedContractSize: true,
      gas: 'auto',
      gasPrice: 'auto'
    },
    mainnet: {
      accounts: mnemonic ? { ...hid } : undefined,
      url: hardhatUrl || ''
    },
    goerli: {
      accounts: mnemonic ? { ...hid } : undefined,
      url: hardhatUrl || ''
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