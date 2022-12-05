import { $, argv, echo, chalk } from 'zx'
import { getSecret } from '@casimir/aws-helpers'

/**
 * Run local a local Ethereum node and deploy contracts
 * 
 * Arguments:
 *      --fork: mainnet, goerli, true, or false (override default goerli)
 * 
 * For more info see:
 *      - https://hardhat.org/hardhat-network/docs/overview
 */
void async function () {
    // Fetch remote submodule code
    $`git submodule update --init --recursive`

    // Get shared seed
    const seed = await getSecret('consensus-networks-bip39-seed')
    process.env.BIP39_SEED = seed
    echo(chalk.bgBlackBright('Your mnemonic is ') + chalk.bgBlue(seed))

    // Set fork rpc if requested, default fork to goerli if set vaguely or unset
    const defaultFork = 'goerli'
    const fork = argv.fork === 'true' ? defaultFork : argv.fork === 'false' ? false : argv.fork ? argv.fork : defaultFork
    if (fork) {
        const key = await getSecret(`consensus-networks-ethereum-${fork}`)
        const url = `https://eth-${fork}.g.alchemy.com/v2/${key}`
        process.env.ETHEREUM_FORKING_URL = url
        echo(chalk.bgBlackBright('Using ') + chalk.bgBlue(fork) + chalk.bgBlackBright(` fork at ${url}`))
    }

    // Enable 12-second interval mining for dev networks
    process.env.INTERVAL_MINING = 'true'

    // Using hardhat local or fork network
    process.env.MOCK_CHAINLINK = 'true'

    $`npm run dev --workspace @casimir/ethereum`
    $`npm run deploy --workspace @casimir/ethereum -- --network localhost`

}()