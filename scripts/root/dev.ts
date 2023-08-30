import { ethers } from 'ethers'
import { run, runSync } from '@casimir/shell'
import { loadCredentials, getSecret } from '@casimir/aws'

/**
 * Run an integrated development environment
 */
void async function () {

    const services = {
        users: {
            port: 4000
        }
    }

    enum ETHEREUM_FORK_URL {
        MAINNET = 'https://mainnet.infura.io/v3/46a379ac6895489f812f33beb726b03b',
        TESTNET = 'https://goerli.infura.io/v3/46a379ac6895489f812f33beb726b03b'
    }

    if (process.env.USE_SECRETS !== 'false') {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || await getSecret('consensus-networks-bip39-seed')
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
    process.env.SSV_NETWORK_ADDRESS = process.env.SSV_NETWORK_ADDRESS || '0xAfdb141Dd99b5a101065f40e3D7636262dce65b3'
    process.env.SSV_NETWORK_VIEWS_ADDRESS = process.env.SSV_NETWORK_VIEWS_ADDRESS || '0x8dB45282d7C4559fd093C26f677B3837a5598914'
    process.env.UNISWAP_V3_FACTORY_ADDRESS = process.env.UNISWAP_V3_FACTORY_ADDRESS || '0x1F98431c8aD98523631AE4a59f267346ea31F984'

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

    if (process.env.NETWORK) {

        if (!process.env.ETHEREUM_RPC_URL) {
            process.env.ETHEREUM_RPC_URL = ETHEREUM_FORK_URL[process.env.NETWORK.toUpperCase()]
            if (!process.env.ETHEREUM_RPC_URL) {
                throw new Error(`Ethereum ${process.env.NETWORK} is not supported`)
            }
        }

        if (!process.env.MANAGER_ADDRESS) {
            throw new Error(`No MANAGER_ADDRESS set for ${process.env.NETWORK} ethereum network.`)
        }

        if (!process.env.VIEWS_ADDRESS) {
            throw new Error(`No VIEWS_ADDRESS set for ${process.env.NETWORK} ethereum network.`)
        }

    } else {

        process.env.ETHEREUM_FORK_RPC_URL = ETHEREUM_FORK_URL[process.env.FORK.toUpperCase()]
        if (!process.env.ETHEREUM_FORK_RPC_URL) {
            throw new Error(`Ethereum ${process.env.FORK} is not supported`)
        }

        process.env.ETHEREUM_RPC_URL = 'http://127.0.0.1:8545'

        const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_FORK_RPC_URL)
        process.env.ETHEREUM_FORK_BLOCK = process.env.ETHEREUM_FORK_BLOCK || `${await provider.getBlockNumber() - 5}`

        const wallet = ethers.Wallet.fromMnemonic(process.env.BIP39_SEED)

        // Account for the mock Chainlink functions deployments
        const deployerNonce = await provider.getTransactionCount(wallet.address) + 5

        if (!process.env.MANAGER_ADDRESS) {
            process.env.MANAGER_ADDRESS = ethers.utils.getContractAddress({
                from: wallet.address,
                nonce: deployerNonce
            })
        }

        if (!process.env.VIEWS_ADDRESS) {
            process.env.VIEWS_ADDRESS = ethers.utils.getContractAddress({
                from: wallet.address,
                nonce: deployerNonce + 1
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
    process.env.PUBLIC_SSV_NETWORK_ADDRESS = process.env.SSV_NETWORK_ADDRESS
    process.env.PUBLIC_SSV_NETWORK_VIEWS_ADDRESS = process.env.SSV_NETWORK_VIEWS_ADDRESS
    process.env.PUBLIC_UNISWAP_V3_FACTORY_ADDRESS = process.env.UNISWAP_V3_FACTORY_ADDRESS
    process.env.PUBLIC_REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS
    process.env.PUBLIC_UPKEEP_ADDRESS = process.env.UPKEEP_ADDRESS
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