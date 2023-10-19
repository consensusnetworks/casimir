import { ethers } from 'ethers'
import { loadCredentials, getSecret } from '@casimir/aws'
import { ETHEREUM_CONTRACTS, ETHEREUM_NETWORK_NAME, ETHEREUM_RPC_URL } from '@casimir/env'
import { run, runSync } from '@casimir/shell'

/**
 * Run an integrated development environment
 */
void async function () {
    const services = {
        users: {
            port: 4000,
        },
        blogs: {
            port: 3003,
        }
    }

    if (process.env.USE_SECRETS !== 'false') {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || ((await getSecret('consensus-networks-bip39-seed')) as string)
    } else {
        process.env.BIP39_SEED = process.env.BIP39_SEED || 'inflict ball claim confirm cereal cost note dad mix donate traffic patient'
    }

    process.env.PROJECT = process.env.PROJECT || 'casimir'
    process.env.STAGE = process.env.STAGE || 'local'
    process.env.CRYPTO_COMPARE_API_KEY = process.env.USE_SECRETS !== 'false' ? process.env.CRYPTO_COMPARE_API_KEY || (await getSecret('casimir-crypto-compare-api-key')) : process.env.CRYPTO_COMPARE_API_KEY || ''
    process.env.WALLET_CONNECT_PROJECT_ID = process.env.USE_SECRETS !== 'false' ? await getSecret('casimir-wallet-connect-project-id') : '8e6877b49198d7a9f9561b8712805726'
    process.env.FORK = process.env.FORK || 'testnet'
    process.env.MOCK_SERVICES = process.env.MOCK_SERVICES || 'true'
    process.env.BUILD_PREVIEW = process.env.BUILD_PREVIEW || 'false'

    if (process.env.BUILD_PREVIEW === 'true') {
        process.env.WEB_URL = process.env.WEB_URL || 'http://localhost:4173'
    } else {
        process.env.WEB_URL = process.env.WEB_URL || 'http://localhost:3001'
    }

    if (process.env.MOCK_SERVICES === 'true') {
        for (const service of Object.keys(services)) {
            const existingProcess = await run(
                `lsof -i :${services[service].port} | grep LISTEN | awk '{print $2}'`
            )
            if (existingProcess) {
                throw new Error(
                    `Port ${services[service].port} is already in use by process ${existingProcess}, but is required by ${service}.`
                )
            }

            process.env[`${service.toUpperCase()}_URL`] = `http://localhost:${services[service].port}`
            run(`npm run dev --workspace @casimir/${service}`)
        }
    }

    const networkKey = process.env.NETWORK?.toUpperCase() || process.env.FORK?.toUpperCase() || 'TESTNET'
    process.env.SSV_NETWORK_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.SSV_NETWORK_ADDRESS
    process.env.SSV_VIEWS_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.SSV_VIEWS_ADDRESS
    process.env.SWAP_FACTORY_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.SWAP_FACTORY_ADDRESS
    if (process.env.NETWORK) {
        process.env.ETHEREUM_RPC_URL = ETHEREUM_RPC_URL[networkKey]
        const networkName = ETHEREUM_NETWORK_NAME[networkKey]

        console.log(`Using ${networkName} network from ${process.env.ETHEREUM_RPC_URL}`)

        if (!process.env.ETHEREUM_RPC_URL) {
            throw new Error(`Ethereum ${process.env.NETWORK} is not supported`)
        }

        process.env.FACTORY_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.FACTORY_ADDRESS
        if (!process.env.FACTORY_ADDRESS) {
            throw new Error(`No factory address provided for ${process.env.NETWORK} ethereum network.`)
        }
    } else {
        process.env.ETHEREUM_FORK_RPC_URL = ETHEREUM_RPC_URL[networkKey]
        if (!process.env.ETHEREUM_FORK_RPC_URL) {
            throw new Error(`Ethereum ${process.env.FORK} is not supported`)
        }

        process.env.ETHEREUM_RPC_URL = 'http://127.0.0.1:8545'

        const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_FORK_RPC_URL)
        process.env.ETHEREUM_FORK_BLOCK = process.env.ETHEREUM_FORK_BLOCK || `${await provider.getBlockNumber() - 5}`

        const wallet = ethers.Wallet.fromMnemonic(process.env.BIP39_SEED)

        // Account for the mock, beacon, and library deployments
        const walletNonce = await provider.getTransactionCount(wallet.address) + 17

        if (!process.env.FACTORY_ADDRESS) {
            process.env.FACTORY_ADDRESS = ethers.utils.getContractAddress({
                from: wallet.address,
                nonce: walletNonce
            })
        }

        run('npm run dev:ethereum')
    }

    process.env.PUBLIC_STAGE = process.env.STAGE
    process.env.PUBLIC_USERS_URL = process.env.USERS_URL
    process.env.PUBLIC_ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL
    process.env.PUBLIC_FACTORY_ADDRESS = process.env.FACTORY_ADDRESS
    process.env.PUBLIC_SSV_NETWORK_ADDRESS = process.env.SSV_NETWORK_ADDRESS
    process.env.PUBLIC_SSV_VIEWS_ADDRESS = process.env.SSV_VIEWS_ADDRESS
    process.env.PUBLIC_SWAP_FACTORY_ADDRESS = process.env.SWAP_FACTORY_ADDRESS
    process.env.PUBLIC_CRYPTO_COMPARE_API_KEY = process.env.CRYPTO_COMPARE_API_KEY
    process.env.PUBLIC_ETHEREUM_FORK_BLOCK = process.env.ETHEREUM_FORK_BLOCK
    process.env.PUBLIC_WALLET_CONNECT_PROJECT_ID = process.env.WALLET_CONNECT_PROJECT_ID

    if (process.env.BUILD_PREVIEW === 'true') {
        await run('npm run build --workspace @casimir/web')
        run('npm run preview --workspace @casimir/web')
    } else {
        run('npm run dev --workspace @casimir/web')
    }

    if (process.env.MOCK_SERVICES === 'true') {
        process.on('SIGINT', () => {
            const mocked: string[] = []
            if (process.env.MOCK_SERVICES === 'true') mocked.push(...Object.keys(services))
            const cleaners = mocked.map(mock => `npm run clean --workspace @casimir/${mock}`).join(' & ')
            if (cleaners.length) {
                console.log(`\n🧹 Cleaning up: ${mocked.map(mock => `@casimir/${mock}`).join(', ')}`)
                runSync(`${cleaners}`)
            }
            process.exit()
        })
    }
}()
