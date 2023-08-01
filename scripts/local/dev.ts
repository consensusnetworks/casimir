import { ethers } from 'ethers'
import { $, chalk, echo } from 'zx'
import { loadCredentials, getSecret, getFutureContractAddress, getWallet, run, runSync } from '@casimir/helpers'

/**
 * Run a Casimir dev server
 */
void async function () {

    const services = {
        users: {
            port: 4000
        }
    }

    const chains = {
        ethereum: {
            forks: {
                mainnet: 'mainnet',
                testnet: 'goerli',
                local: 'hardhat'
            }
        }
    }

    if (process.env.USE_SECRETS !== 'false') {
        await loadCredentials()
    }

    process.env.PROJECT = process.env.PROJECT || 'casimir'
    process.env.STAGE = process.env.STAGE || 'local'
    process.env.BIP39_SEED = process.env.USE_SECRETS !== 'false' ? process.env.BIP39_SEED || await getSecret('consensus-networks-bip39-seed') : process.env.BIP39_SEED || 'test test test test test test test test test test test junk'
    process.env.CRYPTO_COMPARE_API_KEY = process.env.USE_SECRETS !== 'false' ? process.env.CRYPTO_COMPARE_API_KEY || await getSecret('casimir-crypto-compare-api-key') : process.env.CRYPTO_COMPARE_API_KEY || ''
    process.env.EMULATE = process.env.EMULATE || 'false'
    process.env.FORK = process.env.FORK || 'testnet'
    process.env.MOCK_ORACLE = process.env.MOCK_ORACLE || 'true'
    process.env.MOCK_SERVICES = process.env.MOCK_SERVICES || 'true'
    process.env.BUILD_PREVIEW = process.env.BUILD_PREVIEW || 'false'
    
    if (process.env.BUILD_PREVIEW === 'true') {
        process.env.WEB_URL = process.env.WEB_URL || 'http://localhost:4173'
    } else {
        process.env.WEB_URL = process.env.WEB_URL || 'http://localhost:3001'
    }

    if (process.env.MOCK_SERVICES === 'true') {
        for (const service of Object.keys(services)) {
            try {
                if (await run(`lsof -ti:${services[service].port}`)) {
                    await run(`kill -9 $(lsof -ti:${services[service].port})`)
                }
            } catch {
                console.log(`Port ${services[service].port} is available.`)
            }

            process.env[`${service.toUpperCase()}_URL`] = `http://localhost:${services[service].port}`

            $`npm run dev --workspace @casimir/${service}`
        }
    }

    for (const chain of Object.keys(chains)) {

        if (process.env.NETWORK) {

            if (process.env.USE_SECRETS !== 'false') {
                const key = await getSecret(`consensus-networks-${chain}-${process.env.NETWORK}`)
                const currency = chain.slice(0, 3)
                const url = `https://${currency}-${process.env.NETWORK}.g.alchemy.com/v2/${key}`
                process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || url
                echo(chalk.bgBlackBright('Using ') + chalk.bgBlue(process.env.NETWORK) + chalk.bgBlackBright(` ${chain} network at ${url}`))
            } 
            
            if (!process.env.ETHEREUM_RPC_URL) {
                throw new Error(`No ETHEREUM_RPC_URL set for ${process.env.NETWORK} ${chain} network.`)
            }

            if (!process.env.MANAGER_ADDRESS) {
                throw new Error(`No MANAGER_ADDRESS set for ${process.env.NETWORK} ${chain} network.`)
            }

            if (!process.env.VIEWS_ADDRESS) {
                throw new Error(`No VIEWS_ADDRESS set for ${process.env.NETWORK} ${chain} network.`)
            }

        } else {

            if (!chains[chain].forks[process.env.FORK]) {
                throw new Error(`No fork ${process.env.FORK} supported.`)
            }

            if (process.env.USE_SECRETS !== 'false') {
                const key = await getSecret(`consensus-networks-${chain}-${process.env.FORK}`)
                const currency = chain.slice(0, 3)
                const url = `https://${currency}-${chains[chain].forks[process.env.FORK]}.g.alchemy.com/v2/${key}`
                process.env.ETHEREUM_FORK_RPC_URL = process.env.ETHEREUM_FORK_RPC_URL || url
            }

            if (!process.env.ETHEREUM_FORK_RPC_URL) {
                throw new Error(`No ETHEREUM_FORK_RPC_URL set for ${process.env.FORK} ${chain} network.`)
            }

            process.env.ETHEREUM_RPC_URL = 'http://127.0.0.1:8545'

            const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_FORK_RPC_URL)
            process.env.ETHEREUM_FORK_BLOCK = process.env.ETHEREUM_FORK_BLOCK || `${await provider.getBlockNumber() - 5}`

            const wallet = getWallet(process.env.BIP39_SEED)
            const nonce = await provider.getTransactionCount(wallet.address)
            const managerIndex = 1 // We deploy a mock functions oracle before the manager
            
            if (!process.env.MANAGER_ADDRESS) {
                process.env.MANAGER_ADDRESS = await getFutureContractAddress({ wallet, nonce, index: managerIndex })
            }
            if (!process.env.VIEWS_ADDRESS) {
                process.env.VIEWS_ADDRESS = await getFutureContractAddress({ wallet, nonce, index: managerIndex + 1 })
            }
            if (!process.env.REGISTRY_ADDRESS) {
                process.env.REGISTRY_ADDRESS = await getFutureContractAddress({ wallet, nonce, index: managerIndex + 2 })
            }
            if (!process.env.UPKEEP_ADDRESS) {
                process.env.UPKEEP_ADDRESS = await getFutureContractAddress({ wallet, nonce, index: managerIndex + 3 })
            }

            $`npm run dev:${chain}`
        }
    }

    if (process.env.EMULATE === 'true') {

        const port = 5001
        try { 
            if (await run(`lsof -ti:${port}`)) {
                await run(`kill -9 $(lsof -ti:${port})`)
            }
        } catch { 
            console.log(`Port ${port} is available.`) 
        }

        process.env.LEDGER_APP = process.env.LEDGER_APP || 'ethereum'

        $`scripts/ledger/emulate -a ${process.env.LEDGER_APP}`

        process.env.SPECULOS_URL = `http://localhost:${port}`
        $`npx esno scripts/ledger/proxy.ts`

        $`scripts/trezor/emulate`
    }

    process.env.PUBLIC_STAGE = process.env.STAGE
    process.env.PUBLIC_USERS_URL = process.env.USERS_URL
    process.env.PUBLIC_ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL
    process.env.PUBLIC_MANAGER_ADDRESS = process.env.MANAGER_ADDRESS
    process.env.PUBLIC_VIEWS_ADDRESS = process.env.VIEWS_ADDRESS
    process.env.PUBLIC_REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS
    process.env.PUBLIC_UPKEEP_ADDRESS = process.env.UPKEEP_ADDRESS
    process.env.PUBLIC_CRYPTO_COMPARE_API_KEY = process.env.CRYPTO_COMPARE_API_KEY
    process.env.PUBLIC_LEDGER_APP = process.env.LEDGER_APP
    process.env.PUBLIC_SPECULOS_URL = process.env.SPECULOS_URL
    process.env.PUBLIC_ETHEREUM_FORK_BLOCK = process.env.ETHEREUM_FORK_BLOCK

    if (process.env.BUILD_PREVIEW === 'true') {
        $`npm run build --workspace @casimir/web`
        $`npm run preview --workspace @casimir/web`
    } else {
        $`npm run dev --workspace @casimir/web`
    }

    if (process.env.MOCK_ORACLE === 'true' || process.env.MOCK_SERVICES === 'true') {
        process.on('SIGINT', () => {
            const mocked: string[] = []
            if (process.env.MOCK_ORACLE === 'true') mocked.push('oracle')
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