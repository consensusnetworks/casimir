import { $, argv, echo, chalk } from 'zx'
import { getSecret } from '@casimir/aws-helpers'

/**
 * Run local a local Ethereum node and deploy contracts
 * 
 * Arguments:
 *      --chainlink: whether to run local chainlink (override default false)
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
    const fork = argv.fork === 'true' ? 'goerli' : argv.fork === 'false' ? false : argv.fork ? argv.fork : 'goerli'
    if (fork) {
        // const key = await getSecret(`consensus-networks-ethereum-${fork}`)
        // const url = `https://eth-${fork}.g.alchemy.com/v2/${key}`
        const url = 'http://73.17.78.116/goerli/rpc'
        process.env.ETHEREUM_FORKING_URL = url
        echo(chalk.bgBlackBright('Using ') + chalk.bgBlue(fork) + chalk.bgBlackBright(` ethereum fork at ${url}`))
    }

    // Enable 12-second interval mining for dev networks
    process.env.INTERVAL_MINING = 'false'

    // Using hardhat local or fork network
    const chainlink = argv.chainlink === 'true'
    process.env.CHAINLINK = `${chainlink}`

    if (chainlink) {
        $`npm run dev:ganache --workspace @casimir/ethereum`
        // Wait for ganache to start
        await new Promise(resolve => setTimeout(resolve, 5000))
        $`npm run deploy --workspace @casimir/ethereum -- --network ganache`
        $`npm run dev:chainlink --fork=${fork}`
    } else {
        $`npm run dev --workspace @casimir/ethereum`
        // Wait for hardhat to start
        await new Promise(resolve => setTimeout(resolve, 1000))
        $`npm run deploy --workspace @casimir/ethereum -- --network localhost`
    }

}()