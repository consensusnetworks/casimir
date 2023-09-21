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
            port: 4000
        }
    }

    if (process.env.USE_SECRETS !== 'false') {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || await getSecret('consensus-networks-bip39-seed') as string
    } else {
        process.env.BIP39_SEED = process.env.BIP39_SEED || 'inflict ball claim confirm cereal cost note dad mix donate traffic patient'
    }

    process.env.PROJECT = process.env.PROJECT || 'casimir'
    process.env.STAGE = process.env.STAGE || 'local'
    process.env.CRYPTO_COMPARE_API_KEY = process.env.USE_SECRETS !== 'false' ? process.env.CRYPTO_COMPARE_API_KEY || await getSecret('casimir-crypto-compare-api-key') : process.env.CRYPTO_COMPARE_API_KEY || ''
    process.env.EMULATE = process.env.EMULATE || 'false'
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

            const existingProcess = await run(`lsof -i :${services[service].port} | grep LISTEN | awk '{print $2}'`)
            if (existingProcess) {
                throw new Error(`Port ${services[service].port} is already in use by process ${existingProcess}, but is required by ${service}.`)
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

        process.env.MANAGER_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.MANAGER_ADDRESS
        if (!process.env.MANAGER_ADDRESS) {
            throw new Error(`No manager address provided for ${process.env.NETWORK} ethereum network.`)
        }

        process.env.REGISTRY_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.REGISTRY_ADDRESS
        if (!process.env.REGISTRY_ADDRESS) {
            throw new Error(`No registry address provided for ${process.env.NETWORK} ethereum network.`)
        }

        process.env.UPKEEP_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.UPKEEP_ADDRESS
        if (!process.env.UPKEEP_ADDRESS) {
            throw new Error(`No upkeep address provided for ${process.env.NETWORK} ethereum network.`)
        }

        process.env.VIEWS_ADDRESS = ETHEREUM_CONTRACTS[networkKey]?.VIEWS_ADDRESS
        if (!process.env.VIEWS_ADDRESS) {
            throw new Error(`No views address provided for ${process.env.NETWORK} ethereum network.`)
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
        const walletNonce = await provider.getTransactionCount(wallet.address) + 14

        if (!process.env.MANAGER_ADDRESS) {
            process.env.MANAGER_ADDRESS = ethers.utils.getContractAddress({
                from: wallet.address,
                nonce: walletNonce
            })
        }

        if (!process.env.REGISTRY_ADDRESS) {
            process.env.REGISTRY_ADDRESS = ethers.utils.getContractAddress({
                from: process.env.MANAGER_ADDRESS,
                nonce: 1
            })
        }

        if (!process.env.UPKEEP_ADDRESS) {
            process.env.UPKEEP_ADDRESS = ethers.utils.getContractAddress({
                from: process.env.MANAGER_ADDRESS,
                nonce: 2
            })
        }

        if (!process.env.VIEWS_ADDRESS) {
            process.env.VIEWS_ADDRESS = ethers.utils.getContractAddress({
                from: wallet.address,
                nonce: walletNonce + 2
            })
        }

        run('npm run dev:ethereum')
    }

    if (process.env.EMULATE === 'true') {

        const port = 5001
        const existingProcess = await run(`lsof -i :${port} | grep LISTEN | awk '{print $2}'`)
        if (existingProcess) {
            throw new Error(`Port ${port} is already in use by process ${existingProcess}, but is required by speculos.`)
        }

        run('npx esno scripts/ledger/proxy.ts')
        run(`scripts/ledger/emulate -a ${process.env.LEDGER_APP}`)
        run('scripts/trezor/emulate')

        process.env.SPECULOS_URL = `http://localhost:${port}`
        process.env.LEDGER_APP = process.env.LEDGER_APP || 'ethereum'
    }

    process.env.PUBLIC_STAGE = process.env.STAGE
    process.env.PUBLIC_USERS_URL = process.env.USERS_URL
    process.env.PUBLIC_ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL
    process.env.PUBLIC_MANAGER_ADDRESS = process.env.MANAGER_ADDRESS
    process.env.PUBLIC_VIEWS_ADDRESS = process.env.VIEWS_ADDRESS
    process.env.PUBLIC_REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS
    process.env.PUBLIC_UPKEEP_ADDRESS = process.env.UPKEEP_ADDRESS
    process.env.PUBLIC_SSV_NETWORK_ADDRESS = process.env.SSV_NETWORK_ADDRESS
    process.env.PUBLIC_SSV_VIEWS_ADDRESS = process.env.SSV_VIEWS_ADDRESS
    process.env.PUBLIC_SWAP_FACTORY_ADDRESS = process.env.SWAP_FACTORY_ADDRESS
    process.env.PUBLIC_CRYPTO_COMPARE_API_KEY = process.env.CRYPTO_COMPARE_API_KEY
    process.env.PUBLIC_LEDGER_APP = process.env.LEDGER_APP
    process.env.PUBLIC_SPECULOS_URL = process.env.SPECULOS_URL
    process.env.PUBLIC_ETHEREUM_FORK_BLOCK = process.env.ETHEREUM_FORK_BLOCK

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