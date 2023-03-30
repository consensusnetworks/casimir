import { $, chalk, echo } from 'zx'
import { loadCredentials, getSecret } from '@casimir/helpers'
import minimist from 'minimist'

/**
 * Test Ethereum contracts
 * 
 * Arguments:
 *      --classic: whether to use classic contract without compounding (override default false)
 *      --clean: whether to clean build directory (override default false)
 *      --fork: mainnet, goerli, true, or false (override default goerli)
 * 
 * For more info see:
 *      - https://hardhat.org/hardhat-network/docs/overview
 */
void async function () {
    /** Load AWS credentials for configuration */
    await loadCredentials()
    
    /** Parse command line arguments */
    const argv = minimist(process.argv.slice(2))

    /** Default to compound */
    const classic = argv.classic === 'true' || argv.classic === true

    /** Default to no clean */
    const clean = argv.clean === 'true' || argv.clean === true

    /** Set fork rpc if requested, default fork to goerli if set vaguely */
    const fork = argv.fork === 'true' ? 'goerli' : argv.fork === 'false' ? false : argv.fork ? argv.fork : 'goerli'
    
    /** Get shared seed */
    const seed = await getSecret('consensus-networks-bip39-seed')

    process.env.BIP39_SEED = seed
    echo(chalk.bgBlackBright('Your mnemonic is ') + chalk.bgBlue(seed))

    if (fork) {
        const key = await getSecret(`consensus-networks-ethereum-${fork}`)
        const url = `https://eth-${fork}.g.alchemy.com/v2/${key}`
        process.env.ETHEREUM_FORKING_URL = url
        echo(chalk.bgBlackBright('Using ') + chalk.bgBlue(fork) + chalk.bgBlackBright(' fork at ') + chalk.bgBlue(url))
    }

    $`npm run test --clean=${clean} --classic=${classic} --workspace @casimir/ethereum`
}()
