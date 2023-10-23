import fs from 'fs'
import os from 'os'
import localtunnel from 'localtunnel'
import { HardhatUserConfig } from 'hardhat/types'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-toolbox'
import '@openzeppelin/hardhat-upgrades'
import 'hardhat-abi-exporter'
import 'hardhat-contract-sizer'
import 'hardhat-preprocessor'
import 'solidity-docgen'
import { ETHEREUM_CONTRACTS, ETHEREUM_RPC_URL, ETHEREUM_SIGNERS, HARDHAT_NETWORK_KEY } from '@casimir/env'

// Seed is provided
const mnemonic = process.env.BIP39_SEED as string
const hid = { mnemonic, count: 10 }

// Mining interval is provided in seconds
const miningInterval = parseInt(process.env.MINING_INTERVAL as string)
const mining = { auto: false, interval: miningInterval * 1000 } // miningInterval in ms

const hardhatNetwork = process.env.HARDHAT_NETWORK as string

// Local network fork rpc url overrides live network
const forkUrl = process.env.ETHEREUM_FORK_RPC_URL as string
const forkNetwork = forkUrl?.includes('mainnet') ? 'mainnet' : 'goerli'
const forkChainId = { mainnet: 1, goerli: 5 }[forkNetwork]
const forkConfig = { url: forkUrl, blockNumber: parseInt(process.env.ETHEREUM_FORK_BLOCK || '0') || undefined }

const hardhatKey = hardhatNetwork?.toUpperCase() as keyof typeof HARDHAT_NETWORK_KEY
const networkKey = HARDHAT_NETWORK_KEY[hardhatKey] || 'TESTNET'

process.env.DEPOSIT_CONTRACT_ADDRESS = ETHEREUM_CONTRACTS[networkKey].DEPOSIT_CONTRACT_ADDRESS
process.env.KEEPER_REGISTRAR_ADDRESS = ETHEREUM_CONTRACTS[networkKey].KEEPER_REGISTRAR_ADDRESS
process.env.KEEPER_REGISTRY_ADDRESS = ETHEREUM_CONTRACTS[networkKey].KEEPER_REGISTRY_ADDRESS
process.env.LINK_ETH_FEED_ADDRESS = ETHEREUM_CONTRACTS[networkKey].LINK_ETH_FEED_ADDRESS
process.env.LINK_TOKEN_ADDRESS = ETHEREUM_CONTRACTS[networkKey].LINK_TOKEN_ADDRESS
process.env.SSV_NETWORK_ADDRESS = ETHEREUM_CONTRACTS[networkKey].SSV_NETWORK_ADDRESS
process.env.SSV_TOKEN_ADDRESS = ETHEREUM_CONTRACTS[networkKey].SSV_TOKEN_ADDRESS
process.env.SSV_VIEWS_ADDRESS = ETHEREUM_CONTRACTS[networkKey].SSV_VIEWS_ADDRESS
process.env.SWAP_FACTORY_ADDRESS = ETHEREUM_CONTRACTS[networkKey].SWAP_FACTORY_ADDRESS
process.env.SWAP_ROUTER_ADDRESS = ETHEREUM_CONTRACTS[networkKey].SWAP_ROUTER_ADDRESS
process.env.WETH_TOKEN_ADDRESS = ETHEREUM_CONTRACTS[networkKey].WETH_TOKEN_ADDRESS

if (hardhatNetwork !== 'localhost') {
    process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || ETHEREUM_RPC_URL[networkKey]
    process.env.OWNER_ADDRESS = ETHEREUM_SIGNERS[networkKey].OWNER_ADDRESS
    process.env.DAO_ORACLE_ADDRESS = ETHEREUM_SIGNERS[networkKey].DAO_ORACLE_ADDRESS
    process.env.FACTORY_ADDRESS = ETHEREUM_CONTRACTS[networkKey].FACTORY_ADDRESS
    process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS = ETHEREUM_CONTRACTS[networkKey].FUNCTIONS_BILLING_REGISTRY_ADDRESS
    process.env.FUNCTIONS_ORACLE_ADDRESS = ETHEREUM_CONTRACTS[networkKey].FUNCTIONS_ORACLE_ADDRESS
}

const compilerSettings = {
    viaIR: true,
    optimizer: {
        enabled: true,
        runs: 1,
        details: {
            yulDetails: {
                optimizerSteps: 'u'
            }
        }
    }
}
const compilerVersions = ['0.8.18']
const externalCompilerVersions = ['0.4.22', '0.4.24', '0.6.6', '0.6.11', '0.8.4']
const compilers = [...compilerVersions, ...externalCompilerVersions].map(version => ({ version, settings: compilerSettings }))

// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
    docgen: {
        exclude: [
            'dev',
            'mock',
            'vendor'
        ],
        outputDir: process.env.DOCS_OUTPUT_DIR || './build/docs',
        templates: process.env.DOCS_TEMPLATE_DIR,
        pages: () => 'solidity-api.md'
    },
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
        tests: './test',
        sources: './src/v1',
        artifacts: './build/hardhat/artifacts',
        cache: './build/hardhat/cache'
    },
    abiExporter: {
        path: './build/abi',
        runOnCompile: true,
        clear: true,
        flat: true,
        spacing: 4,
        format: 'fullName'
    },
    typechain: {
        outDir: './build/@types'
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
            url: process.env.ETHEREUM_RPC_URL || '',
            allowUnlimitedContractSize: true,
            gas: 'auto',
            gasPrice: 'auto'
        },
        goerli: {
            accounts: mnemonic ? hid : undefined,
            url: process.env.ETHEREUM_RPC_URL || '',
            allowUnlimitedContractSize: true,
            gas: 'auto',
            gasPrice: 'auto'
        }
    }
}

// Start a local tunnel for using RPC over https (e.g. for Metamask on mobile)
if (process.env.TUNNEL === 'true') {
    runLocalTunnel()
}

function getRemappings() {
    return fs
        .readFileSync('remappings.txt', 'utf8')
        .split('\n')
        .filter(Boolean) // remove empty lines
        .map((line) => line.trim().split('='))
}

function runLocalTunnel() {
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