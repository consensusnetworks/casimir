import { $, echo, chalk } from 'zx'
import { loadCredentials, getSecret } from '@casimir/helpers'
import minimist from 'minimist'

/**
 * Run local a local Ethereum node and deploy contracts
 * 
 * Arguments:
 *      --classic: whether to use classic contract without compounding (override default false)
 *      --clean: whether to clean build directory (override default true)
 *      --execution: hardhat or gananche (override default hardhat)
 *      --fork: mainnet, goerli, true, or false (override default goerli)
 *      --simulation: whether to run simulation (override default false)
 * 
 * For more info see:
 *      - https://hardhat.org/hardhat-network/docs/overview
 */
void async function () {
    /** Load AWS credentials for configuration */
    await loadCredentials()
    
    /** Parse command line arguments */
    const argv = minimist(process.argv.slice(2))

    /** Default to no clean */
    const clean = argv.clean === 'true' || argv.clean === true

    /** Default to compound */
    const classic = argv.classic === 'true' || argv.classic === true

    /** Set execution environment */
    const execution = argv.execution === 'ganache' ? 'ganache' : 'hardhat'

    /** Set fork rpc if requested, default fork to goerli if set vaguely or unset */
    const fork = argv.fork === 'true' ? 'goerli' : argv.fork === 'false' ? false : argv.fork ? argv.fork : 'goerli'

    /** Get shared seed */
    const seed = await getSecret('consensus-networks-bip39-seed')

    /** Default to no simulation */
    const simulation = argv.simulation === 'true' || argv.simulation === true

    process.env.BIP39_SEED = seed
    echo(chalk.bgBlackBright('Your mnemonic seed is ') + chalk.bgBlue(seed))

    if (fork) {
        const key = await getSecret(`consensus-networks-ethereum-${fork}`)
        const url = `https://eth-${fork}.g.alchemy.com/v2/${key}`
        process.env.ETHEREUM_FORKING_URL = url
        echo(chalk.bgBlackBright('Using ') + chalk.bgBlue(fork) + chalk.bgBlackBright(' ethereum fork at ') + chalk.bgBlue(url))
    }

    if (clean) {
        await $`npm run clean --workspace @casimir/ethereum`
    }
    
    /** Set classic flag */
    process.env.CLASSIC = `${classic}`
    
    /** Enable 12-second interval mining for dev networks */
    process.env.MINING_INTERVAL = '12'

    /** Enable simulation */
    process.env.SIMULATION = `${simulation}`

    if (execution === 'ganache') {
        $`npm run node:ganache --workspace @casimir/ethereum`
        // Wait for ganache to start
        const ganacheWaitTime = 5000
        await new Promise(resolve => setTimeout(resolve, ganacheWaitTime))
        $`npm run dev --workspace @casimir/ethereum -- --network ganache`
    } else {
        $`npm run node --workspace @casimir/ethereum`
        // Wait for hardhat to start
        const hardhatWaitTime = 2500
        await new Promise(resolve => setTimeout(resolve, hardhatWaitTime))
        $`npm run dev --workspace @casimir/ethereum -- --network localhost`
    }

}()