import { $, chalk, echo } from 'zx'
import { loadCredentials, getSecret } from '@casimir/helpers'
import minimist from 'minimist'

/**
 * Test Ethereum contracts
 * 
 * Arguments:
 *      --clean: whether to clean build directory (override default false)
 *      --fork: mainnet, goerli, true, or false (override default goerli)
 *      --mock: whether to use mock contracts (override default true)
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

    /** Set fork rpc if requested, default fork to goerli if set vaguely */
    const fork = argv.fork === 'true' ? 'goerli' : argv.fork === 'false' ? false : argv.fork ? argv.fork : 'goerli'

    /** Default to mock external contracts */
    const mock = argv.mock !== 'false' && argv.mock !== false

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

    /** Set mock */
    process.env.MOCK_EXTERNAL_CONTRACTS = `${mock}`

    $`npm run test --clean=${clean} --workspace @casimir/ethereum`
}()
