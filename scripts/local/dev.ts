import { $, argv, chalk, echo } from 'zx'
import { loadCredentials, getSecret, spawnPromise } from '@casimir/helpers'

/**
 * Run a Casimir dev server.
 * 
 * Arguments:
 *      --app: app name (optional, i.e., --app=web)
 *      --clean: delete existing pgdata before deploy (optional, i.e., --clean)
 *      --emulate: emulate hardware wallet services (optional, i.e., --emulate=ethereum)
 *      --fork: fork name (optional, i.e., --fork=goerli)
 *      --mock: mock services (optional, i.e., --mock=true)
 *      --network: network name (optional, i.e., --network=goerli)
 *      --seed: seed database with resources (optional, i.e., --seed=user)
 */
void async function () {

    /** Local apps and configuration */
    const apps = {
        web: {
            chains: ['ethereum'],
            services: ['users'],
            tables: ['accounts', 'nonces', 'users']
        }
    }

    /** Chain forks */
    const forks = {
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
    process.env.PUBLIC_STAGE = process.env.STAGE // Pass stage to client apps

    /** Todo get network/fork nonce based on selection and predict address */
    process.env.PUBLIC_SSV_MANAGER = '0xaaf5751d370d2fD5F1D5642C2f88bbFa67a29301'

    /** Default to the web app */
    const app = argv.app || 'web'

    /** Default to clean mock db */
    const clean = argv.clean !== 'false' || argv.clean !== false

    /** Default to no hardware wallet emulators or ethereum if set vaguely */
    const emulate = (argv.emulate === 'true' || argv.emulate === true) ? 'ethereum' : argv.emulators === 'false' ? false : argv.emulate

    /** Default to no fork or testnet if set vaguely */
    const fork = argv.fork === 'true' ? 'testnet' : argv.fork === 'false' ? false : argv.fork

    /** Default to local mock */
    const mock = argv.mock !== 'false' || argv.mock !== false

    /** Default to no network or testnet if set vaguely */
    const network = argv.network === 'true' ? 'testnet' : argv.network === 'false' ? false : argv.network

    /** Default to no db seed or seed user resources if set vaguely */
    const seed = argv.seed === 'true' || argv.seed === true ? 'user' : argv.seed === 'false' ? false : argv.seed

    const { chains, services, tables } = apps[app as keyof typeof apps]

    if (mock) {
        /** Mock postgres database */
        $`npm run watch:postgres --clean ${clean} --seed ${seed} --tables=${tables.join(',')} --workspace @casimir/data`
        // $`npm run dev:postgres --clean --seed ${seed} --tables=${tables.join(',')} --workspace @casimir/data`

        /** Mock services */
        let port = 4000
        for (const service of services) {
            process.env[`PUBLIC_${service.toUpperCase()}_PORT`] = `${port}`

            $`npm run dev --workspace @casimir/${service}`

            try {
                if (await spawnPromise(`lsof -ti:${port}`)) {
                    await spawnPromise(`kill -9 $(lsof -ti:${port})`)
                }
            } catch {
                console.log(`Port ${port} is available.`)
            }

            ++port
        }
    }

    for (const chain of chains) {
        if (network) {
            const key = await getSecret(`consensus-networks-ethereum-${network}`)
            const url = `https://eth-${network}.g.alchemy.com/v2/${key}`
            process.env.ETHEREUM_RPC_URL = url
            echo(chalk.bgBlackBright('Using ') + chalk.bgBlue(network) + chalk.bgBlackBright(` ${chain} network at ${url}`))
        } else {
            const chainFork = forks[chain][fork]
            $`npm run dev:${chain} --fork=${chainFork}`
        }
    }

    if (emulate) {

        /** Emulate Ledger */
        const port = 5001
        try { 
            if (await spawnPromise(`lsof -ti:${port}`)) {
                await spawnPromise(`kill -9 $(lsof -ti:${port})`)
            }
        } catch { 
            console.log(`Port ${port} is available.`) 
        }

        process.env.PUBLIC_SPECULOS_PORT = `${port}`
        process.env.PUBLIC_LEDGER_APP = emulate
        $`scripts/ledger/emulate -a ${emulate}`
        /** Wait to push proxy announcement later in terminal run */
        setTimeout(() => {
            $`npx esno scripts/ledger/proxy.ts`
        }, 5000)

        /** Emulate Trezor */
        $`scripts/trezor/emulate`
    }

    /** Run app */
    $`npm run dev --workspace @casimir/${app}`

}()