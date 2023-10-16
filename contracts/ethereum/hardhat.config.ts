import fs from "fs"
import os from "os"
import localtunnel from "localtunnel"
import { HardhatUserConfig } from "hardhat/types"
import "@typechain/hardhat"
import "@nomiclabs/hardhat-ethers"
import "@nomicfoundation/hardhat-toolbox"
import "@openzeppelin/hardhat-upgrades"
import "hardhat-abi-exporter"
import "hardhat-preprocessor"
import { ETHEREUM_CONTRACTS } from "@casimir/env"

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
const forkNetwork = forkUrl?.includes("mainnet") ? "mainnet" : "goerli"
const forkChainId = { mainnet: 1, goerli: 5 }[forkNetwork]
const forkConfig = { url: forkUrl, blockNumber: parseInt(process.env.ETHEREUM_FORK_BLOCK || "0") || undefined }

const externalEnv = {
  mainnet: {
    BEACON_DEPOSIT_ADDRESS: "0x00000000219ab540356cBB839Cbe05303d7705Fa",
    DAO_ORACLE_ADDRESS: "",
    FUNCTIONS_BILLING_REGISTRY_ADDRESS: "",
    FUNCTIONS_ORACLE_ADDRESS: "",
    KEEPER_REGISTRAR_ADDRESS: "	0xDb8e8e2ccb5C033938736aa89Fe4fa1eDfD15a1d",
    KEEPER_REGISTRY_ADDRESS: "0x02777053d6764996e594c3E88AF1D58D5363a2e6",
    LINK_ETH_FEED_ADDRESS: "0xDC530D9457755926550b59e8ECcdaE7624181557",
    LINK_TOKEN_ADDRESS: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    POOL_BEACON_ADDRESS: "",
    REGISTRY_BEACON_ADDRESS: "",
    SSV_NETWORK_ADDRESS: "",
    SSV_TOKEN_ADDRESS: "0x9D65fF81a3c488d585bBfb0Bfe3c7707c7917f54",
    SSV_VIEWS_ADDRESS: "",
    SWAP_FACTORY_ADDRESS: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    SWAP_ROUTER_ADDRESS: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    UPKEEP_BEACON_ADDRESS: "",
    WETH_TOKEN_ADDRESS: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  },
  goerli: {
    BEACON_DEPOSIT_ADDRESS: ETHEREUM_CONTRACTS.TESTNET.BEACON_DEPOSIT_ADDRESS,
    DAO_ORACLE_ADDRESS: "",
    FUNCTIONS_BILLING_REGISTRY_ADDRESS: "",
    FUNCTIONS_ORACLE_ADDRESS: "",
    KEEPER_REGISTRAR_ADDRESS: ETHEREUM_CONTRACTS.TESTNET.KEEPER_REGISTRAR_ADDRESS,
    KEEPER_REGISTRY_ADDRESS: ETHEREUM_CONTRACTS.TESTNET.KEEPER_REGISTRY_ADDRESS,
    LINK_ETH_FEED_ADDRESS: ETHEREUM_CONTRACTS.TESTNET.LINK_ETH_FEED_ADDRESS,
    LINK_TOKEN_ADDRESS: ETHEREUM_CONTRACTS.TESTNET.LINK_TOKEN_ADDRESS,
    POOL_BEACON_ADDRESS: "",
    REGISTRY_BEACON_ADDRESS: "",
    SSV_NETWORK_ADDRESS: ETHEREUM_CONTRACTS.TESTNET.SSV_NETWORK_ADDRESS,
    SSV_TOKEN_ADDRESS: ETHEREUM_CONTRACTS.TESTNET.SSV_TOKEN_ADDRESS,
    SSV_VIEWS_ADDRESS: ETHEREUM_CONTRACTS.TESTNET.SSV_VIEWS_ADDRESS,
    SWAP_FACTORY_ADDRESS: ETHEREUM_CONTRACTS.TESTNET.SWAP_FACTORY_ADDRESS,
    SWAP_ROUTER_ADDRESS: ETHEREUM_CONTRACTS.TESTNET.SWAP_ROUTER_ADDRESS,
    UPKEEP_BEACON_ADDRESS: "",
    WETH_TOKEN_ADDRESS: ETHEREUM_CONTRACTS.TESTNET.WETH_TOKEN_ADDRESS
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
  viaIR: true,
  optimizer: {
    enabled: true,
    runs: 1,
    details: {
      yulDetails: {
        optimizerSteps: "u"
      }
    }
  }
}
const compilerVersions = ["0.8.18"]
const externalCompilerVersions = ["0.4.22", "0.4.24", "0.6.6", "0.6.11", "0.8.4"]
const compilers = [
  ...compilerVersions, 
  ...externalCompilerVersions
].map(version => ({ version, settings: compilerSettings }))

// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  mocha: {
    timeout: 60000
  },
  preprocess: {
    eachLine: () => ({
      transform: (line: string) => {
        if (line.match(/^\s*import /i)) {
          for (const [from, to] of getRemappings()) {
            if (line.includes(from)) {
              line = line.replace(from, to)
              break
            }
          }
        }
        return line
      }
    })
  },
  solidity: {
    compilers,
  },
  paths: {
    tests: "./test",
    sources: "./src/v1",
    artifacts: "./build/hardhat/artifacts",
    cache: "./build/hardhat/cache"
  },
  abiExporter: {
    path: "./build/abi",
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 4,
    format: "fullName"
  },
  typechain: {
    outDir: "./build/@types"
  },
  networks: {
    hardhat: {
      accounts: mnemonic ? hid : undefined,
      chainId: forkChainId || 1337,
      forking: forkUrl ? forkConfig : undefined,
      mining: miningInterval ? mining : { auto: true },
      allowUnlimitedContractSize: true,
      gas: "auto",
      gasPrice: "auto"
    },
    mainnet: {
      accounts: mnemonic ? hid : undefined,
      url: hardhatUrl || "",
      allowUnlimitedContractSize: true,
      gas: "auto",
      gasPrice: "auto"
    },
    goerli: {
      accounts: mnemonic ? hid : undefined,
      url: hardhatUrl || "",
      allowUnlimitedContractSize: true,
      gas: "auto",
      gasPrice: "auto"
    }
  }
}

// Start a local tunnel for using RPC over https (e.g. for Metamask on mobile)
if (process.env.TUNNEL === "true") {
  runLocalTunnel()
}

function getRemappings() {
  return fs
    .readFileSync("remappings.txt", "utf8")
    .split("\n")
    .filter(Boolean) // remove empty lines
    .map((line) => line.trim().split("="))
}

function runLocalTunnel() {
  const localSubdomain = `local-hardhat-${os.userInfo().username.toLowerCase()}`
  const localUrl = `https://${localSubdomain}.loca.lt`
  localtunnel({ port: 8545, subdomain: localSubdomain }).then(
    (tunnel: localtunnel.Tunnel) => {
      if (localUrl === tunnel.url) {
        console.log("Your default local tunnel url is", localUrl)
      } else {
        console.log("Your default local tunnel url is not available, use", tunnel.url, "instead")
      }
      process.on("SIGINT", () => {
        tunnel.close()
      })
    }
  )
}

export default config