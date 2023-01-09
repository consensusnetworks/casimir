import { $, argv, chalk, echo } from 'zx'
import { getSecret } from '@casimir/aws-helpers'
import { pascalCase } from '@casimir/string-helpers'
import { parseStdout } from '@casimir/zx-helpers'

/** Local apps and configuration */
const apps = {
    web: {
        chains: ['ethereum'],
        infrastructure: 'cdk',
        services: ['auth']
    }
}

const forks = {
    ethereum: {
        mainnet: 'mainnet',
        testnet: 'goerli'
    }
}

/** The name of the CDK project */
const project = process.env.PROJECT || 'casimir'

/** The default development stage of the CDK project */
const stage = process.env.STAGE || 'dev'

/** Pascal case representations of CDK variables */
const Project = pascalCase(project as string)
const Stage = pascalCase(stage as string)

/**
 * Run a Casimir dev server
 * 
 * Arguments:
 *      --app: app name (optional, i.e., --app=web)
 *      --fork: fork name (optional, i.e., --fork=goerli)
 *      --ledger: emulate ledger for chain (optional, i.e., --ledger=ethereum)
 *      --mock: mock services (optional, i.e., --mock=true)
 *      --network: network name (optional, i.e., --network=goerli)
 *      --trezor: emulate trezor (optional, i.e., --trezor=true)
 *      --external: externalize all rpc urls (optional, i.e., --external=true)
 */
void async function () {
    /** Fetch remote submodule code */
    $`git submodule update --init --recursive`

    /** Set project-wide variables */
    process.env.PROJECT = project
    process.env.STAGE = stage

    /** Todo get network/fork nonce based on selection and predict address */
    process.env.PUBLIC_SSV_ADDRESS = '0x07E05700CB4E946BA50244e27f01805354cD8eF0' // '0xaaf5751d370d2fD5F1D5642C2f88bbFa67a29301'

    /** Default to the web app */
    const app = argv.app || 'web'

    /** Default to no mock */
    const mock = argv.mock === 'true'

    /** Default to no network or testnet if set vaguely */
    const network = argv.network === 'true' ? 'testnet' : argv.network === 'false' ? false : argv.network

    /** Default to no fork or testnet if set vaguely */
    const fork = argv.fork === 'true' ? 'testnet' : argv.fork === 'false' ? false : argv.fork

    /** Default to no external rpc */
    const external = argv.external === 'true'

    /** Default to no ledger emulator or ethereum if set vaguely */
    const ledger = argv.ledger === 'true' ? 'ethereum' : argv.ledger === 'false' ? false : argv.ledger

    /** Default to no trezor emulator */
    const trezor = argv.trezor === 'true'

    const { chains, infrastructure, services } = apps[app as keyof typeof apps]

    if (mock) {

        /** Skip bootstrap if stack exists for current stage (and cdk:bootstrap throws) */
        try { 
            await $`npm run cdk:bootstrap --workspace @casimir/cdk`
        } catch {
            echo(chalk.bgBlackBright('CDK Toolkit stack for ') + chalk.bgBlue(`${Project}${Stage}`) + chalk.bgBlackBright(' was already bootstrapped. Disregard any CDK errors listed above this line.'))
        }
        await $`npm run cdk:synth --workspace @casimir/cdk`

        let port = 4000
        for (const service of services) {
            process.env[`PUBLIC_${service.toUpperCase()}_PORT`] = `${port}`

            $`npm run watch --workspace @casimir/${service}`
            const Service = pascalCase(service)

            try {
                if (parseStdout(await $`lsof -ti:${port}`)) {
                    $`kill -9 $(lsof -ti:${port})`
                }
            } catch {
                console.log(`Port ${port} is available.`)
            }

            $`sam local start-api \
            --warm-containers "LAZY" \
            --port ${port} \
            --template infrastructure/${infrastructure}/cdk.out/${Project}${Service}Stack${Stage}.template.json \
            --log-file "services/${service}/mock-logs.txt" \
            --profile ${process.env.PROFILE || 'consensus-networks-dev'}`

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
            if (external) {
                process.env.LOCAL_TUNNEL = 'true'
            }

            const chainFork = forks[chain][fork]
            $`npm run dev:${chain} --fork=${chainFork}`
        }
    }

    if (ledger) {
        const port = 5001
        try { 
            if (parseStdout(await $`lsof -ti:${port}`)) {
                $`kill -9 $(lsof -ti:${port})`
            }
        } catch { 
            console.log(`Port ${port} is available.`) 
        }

        process.env.PUBLIC_SPECULOS_PORT = `${port}`
        process.env.PUBLIC_LEDGER_APP = ledger

        $`npm run dev:ledger --app=${ledger}`
    }

    if (trezor) {
        $`npm run dev:trezor`
    }

    $`npm run dev --workspace @casimir/${app}`

}()