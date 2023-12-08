import { ethers } from "ethers"
import { loadCredentials, getSecret } from "@casimir/aws"
import { ETHEREUM_CONTRACTS, ETHEREUM_NETWORK_NAME, ETHEREUM_RPC_URL, ETHEREUM_WS_URL } from "@casimir/env"
import { run, runSync } from "@casimir/shell"

/**
 * Root script used to run an integrated development environment
 * You can override the following configuration environment variables:
 * - PROJECT: casimir
 * - STAGE: local | dev | sandbox | prod
 * - APP: app | www
 * - NETWORK: mainnet | testnet
 * - FORK: mainnet | testnet
 * - USE_SECRETS: true | false
 * - BUILD_PREVIEW: true | false
 * - MOCK_SERVICES: true | false
 * - BIP39_SEED: string
 * - CRYPTO_COMPARE_API_KEY: string
 * - HACKMD_TOKEN: string
 * - WALLET_CONNECT_PROJECT_ID: string
 * - ETHEREUM_RPC_URL: string
 * - ETHEREUM_FORK_RPC_URL: string
 * - ETHEREUM_FORK_BLOCK: string
 */
async function root() {
    const apps = {
        www: {
            contracts: false,
            port: 3002,
            services: {
                blog: {
                    port: 4001,
                }
            }
        },
        app: {
            contracts: true,
            port: 3001,
            services: {
                users: {
                    port: 4000,
                }
            }
        }
    }

    const app = process.env.APP || "app"
    if (!apps[app]) {
        throw new Error(`App ${app} is not supported`)
    }
    const services = apps[app].services || {}

    if (process.env.USE_SECRETS !== "false") {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || await getSecret("consensus-networks-bip39-seed") || ""
        process.env.CRYPTO_COMPARE_API_KEY = process.env.CRYPTO_COMPARE_API_KEY || await getSecret("casimir-crypto-compare-api-key") || ""
        process.env.HACKMD_TOKEN = process.env.HACKMD_TOKEN || await getSecret("casimir-blog-hackmd-token") || ""
        process.env.WALLET_CONNECT_PROJECT_ID = process.env.WALLET_CONNECT_PROJECT_ID || await getSecret("casimir-wallet-connect-project-id") || ""
    } else {
        process.env.BIP39_SEED = process.env.BIP39_SEED || "inflict ball claim confirm cereal cost note dad mix donate traffic patient"
        process.env.CRYPTO_COMPARE_API_KEY = process.env.CRYPTO_COMPARE_API_KEY || ""
        process.env.HACKMD_TOKEN = process.env.HACKMD_TOKEN || ""
        process.env.WALLET_CONNECT_PROJECT_ID = process.env.WALLET_CONNECT_PROJECT_ID || "8e6877b49198d7a9f9561b8712805726"
    }

    console.log(process.env.BIP39_SEED)

    process.env.PROJECT = process.env.PROJECT || "casimir"
    process.env.STAGE = process.env.STAGE || "local"
    process.env.FORK = process.env.FORK || "testnet"
    process.env.MOCK_SERVICES = process.env.MOCK_SERVICES || "true"
    process.env.BUILD_PREVIEW = process.env.BUILD_PREVIEW || "false"

    if (process.env.BUILD_PREVIEW === "true") {
        process.env[`${app.toUpperCase()}_URL`] = `http://localhost:${apps[app].port}`
    } else {
        process.env[`${app.toUpperCase()}_URL`] = `http://localhost:${apps[app].port}`
    }

    if (process.env.MOCK_SERVICES === "true") {
        for (const service of Object.keys(services)) {
            const existingProcess = await run(`lsof -i :${services[service].port} | grep LISTEN | awk '{print $2}'`)
            if (existingProcess) {
                throw new Error(`Port ${services[service].port} is already in use by process ${existingProcess}, but is required by ${service}.`)
            }

            process.env[`${service.toUpperCase()}_URL`] = `http://localhost:${services[service].port}`
            run(`npm run dev --workspace @casimir/${service}`)
        }
    }

    const networkKey = process.env.NETWORK?.toUpperCase() || process.env.FORK?.toUpperCase() || "TESTNET"
    process.env.FACTORY_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.FACTORY_ADDRESS
    process.env.SSV_NETWORK_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.SSV_NETWORK_ADDRESS
    process.env.SSV_VIEWS_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.SSV_VIEWS_ADDRESS
    if (apps[app].contracts) {
        if (process.env.NETWORK) {
            const networkName = ETHEREUM_NETWORK_NAME[networkKey]
            process.env.ETHEREUM_RPC_URL = ETHEREUM_RPC_URL[networkKey]
            process.env.ETHEREUM_WS_URL = ETHEREUM_WS_URL[networkKey]
            console.log(`Connecting to ${networkName} network at ${process.env.ETHEREUM_RPC_URL}`)
        } else {
            const networkName = ETHEREUM_NETWORK_NAME[networkKey]
            process.env.ETHEREUM_FORK_RPC_URL = ETHEREUM_RPC_URL[networkKey]
            process.env.ETHEREUM_RPC_URL = "http://127.0.0.1:8545"
            console.log(`Connecting to ${networkName} network fork at ${process.env.ETHEREUM_RPC_URL}`)

            const forkProvider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_FORK_RPC_URL)
            process.env.ETHEREUM_FORK_BLOCK = process.env.ETHEREUM_FORK_BLOCK || `${await forkProvider.getBlockNumber() - 10}`
            console.log(`📍 Forking started at ${process.env.ETHEREUM_FORK_BLOCK}`)
        
            process.env.TUNNEL = process.env.TUNNEL || "false"
            process.env.MINING_INTERVAL = "12"
            process.env.SIMULATE_EIGEN = "true"
            process.env.SIMULATE_REWARDS = "true"

            run("npm run dev --workspace @casimir/ethereum -- --network localhost")
        }
    }

    process.env.PUBLIC_STAGE = process.env.STAGE
    process.env.PUBLIC_BLOG_URL = process.env.BLOG_URL
    process.env.PUBLIC_USERS_URL = process.env.USERS_URL
    process.env.PUBLIC_ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL
    process.env.PUBLIC_ETHEREUM_WS_URL = process.env.ETHEREUM_WS_URL
    process.env.PUBLIC_FACTORY_ADDRESS = process.env.FACTORY_ADDRESS
    process.env.PUBLIC_SSV_NETWORK_ADDRESS = process.env.SSV_NETWORK_ADDRESS
    process.env.PUBLIC_SSV_VIEWS_ADDRESS = process.env.SSV_VIEWS_ADDRESS
    process.env.PUBLIC_CRYPTO_COMPARE_API_KEY = process.env.CRYPTO_COMPARE_API_KEY
    process.env.PUBLIC_ETHEREUM_FORK_BLOCK = process.env.ETHEREUM_FORK_BLOCK
    process.env.PUBLIC_WALLET_CONNECT_PROJECT_ID = process.env.WALLET_CONNECT_PROJECT_ID

    if (process.env.BUILD_PREVIEW === "true") {
        await run(`npm run build --workspace @casimir/${app}`)
        run(`npm run preview --workspace @casimir/${app}`)
    } else {
        run(`npm run dev --workspace @casimir/${app}`)
    }

    if (process.env.MOCK_SERVICES === "true" && app === "app") {
        process.on("SIGINT", () => {
            console.log("🧹 Cleaning up users service")
            runSync("npm run clean --workspace @casimir/users")
            process.exit()
        })
    }
}

root().catch(error => {
    console.error(error)
    process.exit(1)
})
