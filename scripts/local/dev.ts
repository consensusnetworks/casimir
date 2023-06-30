import { $, chalk, echo } from 'zx'
import { loadCredentials, getSecret, getFutureContractAddress, getWallet, run, runSync } from '@casimir/helpers'

/**
 * Run a Casimir dev server
 */
void async function () {

    /** Backend services */
    const services = {
        users: {
            port: 4000
        }
    }

    /** Chain forks */
    const chains = {
        ethereum: {
            mainnet: 'mainnet',
            testnet: 'goerli'
        }
    }

    /** Load AWS credentials for configuration */
    await loadCredentials()

    /** Set project-wide variables */
    process.env.PROJECT = process.env.PROJECT || 'casimir'
    process.env.STAGE = process.env.STAGE || 'dev'

    /** Pass stage to web app */
    process.env.PUBLIC_STAGE = process.env.STAGE

    /** Get exchange price API key */
    process.env.PUBLIC_CRYPTO_COMPARE_API_KEY = await getSecret('casimir-crypto-compare-api-key')

    /** Default to no hardware wallet emulators */
    process.env.EMULATE = process.env.EMULATE || 'false'

    /** Default to testnet */
    process.env.FORK = process.env.FORK || 'testnet'

    /** Default to stubbed oracle service handlers */
    process.env.MOCK_ORACLE = process.env.MOCK_ORACLE || 'false'

    /** Default to mock backend services */
    process.env.MOCK_SERVICES = process.env.MOCK_SERVICES || 'true'

    /** Default to no build preview */
    process.env.BUILD_PREVIEW = process.env.BUILD_PREVIEW || 'false'

    /** Default to no live network */
    process.env.NETWORK = process.env.NETWORK || ''

    if (process.env.MOCK_SERVICES === 'true') {
        /** Mock services */
        for (const service of Object.keys(services)) {
            process.env[`PUBLIC_${service.toUpperCase()}_PORT`] = `${services[service].port}`

            try {
                if (await run(`lsof -ti:${services[service].port}`)) {
                    await run(`kill -9 $(lsof -ti:${services[service].port})`)
                }
            } catch {
                console.log(`Port ${services[service].port} is available.`)
            }

            $`npm run watch --workspace @casimir/${service}`
        }
    }

    for (const chain of Object.keys(chains)) {

        if (process.env.NETWORK) {
            const key = await getSecret(`consensus-networks-${chain}-${process.env.NETWORK}`)
            const currency = chain.slice(0, 3)
            const url = `https://${currency}-${process.env.NETWORK}.g.alchemy.com/v2/${key}`
            process.env.ETHEREUM_RPC_URL = url
            echo(chalk.bgBlackBright('Using ') + chalk.bgBlue(process.env.NETWORK) + chalk.bgBlackBright(` ${chain} network at ${url}`))

            // Todo - add deployed addresses
            // process.env.BIP39_SEED = seed
            // process.env.PUBLIC_MANAGER_ADDRESS = `${managerAddress}`

        } else if (process.env.FORK) {

            /** Chain fork nonces */
            const nonces = {
                ethereum: {
                    mainnet: 0,
                    testnet: 12
                }
            }

            process.env.ETHEREUM_RPC_URL = 'http://localhost:8545'

            const seed = await getSecret('consensus-networks-bip39-seed')
            const wallet = getWallet(seed)
            const nonce = nonces[chain][process.env.FORK]
            const managerIndex = 1 // We deploy a mock functions oracle before the manager
            if (!process.env.PUBLIC_MANAGER_ADDRESS) {
                const managerAddress = await getFutureContractAddress({ wallet, nonce, index: managerIndex })
                process.env.PUBLIC_MANAGER_ADDRESS = `${managerAddress}`
            }
            if (!process.env.PUBLIC_VIEWS_ADDRESS) {
                const viewsAddress = await getFutureContractAddress({ wallet, nonce, index: managerIndex + 1 })
                process.env.PUBLIC_VIEWS_ADDRESS = `${viewsAddress}`
            }
            process.env.BIP39_SEED = seed

            $`npm run dev:${chain}`
        }
    }

    if (process.env.EMULATE === 'true') {

        /** Emulate Ledger */
        const port = 5001
        try { 
            if (await run(`lsof -ti:${port}`)) {
                await run(`kill -9 $(lsof -ti:${port})`)
            }
        } catch { 
            console.log(`Port ${port} is available.`) 
        }

        process.env.LEDGER_APP = process.env.LEDGER_APP || 'ethereum'
        
        /** Pass ledger app to web app */
        process.env.PUBLIC_LEDGER_APP = process.env.LEDGER_APP

        /** Emulate Ledger */
        $`scripts/ledger/emulate -a ${process.env.LEDGER_APP}`

        process.env.PUBLIC_SPECULOS_URL = `http://localhost:${port}`
        $`npx esno scripts/ledger/proxy.ts`

        /** Emulate Trezor */
        $`scripts/trezor/emulate`
    }

    /** Run web app */
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