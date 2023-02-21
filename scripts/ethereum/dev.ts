import { $, argv, echo, chalk } from 'zx'
import { getSecret } from '@casimir/aws-helpers'

/**
 * Run local a local Ethereum node and deploy contracts
 * 
 * Arguments:
 *      --execution: hardhat or gananche (override default hardhat)
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
    echo(chalk.bgBlackBright('Your mnemonic seed is ') + chalk.bgBlue(seed))

    // Set fork rpc if requested, default fork to goerli if set vaguely or unset
    const fork = argv.fork === 'true' ? 'goerli' : argv.fork === 'false' ? false : argv.fork ? argv.fork : 'goerli'
    if (fork) {
        const key = await getSecret(`consensus-networks-ethereum-${fork}`)
        const url = `https://eth-${fork}.g.alchemy.com/v2/${key}`
        process.env.ETHEREUM_FORKING_URL = url
        echo(chalk.bgBlackBright('Using ') + chalk.bgBlue(fork) + chalk.bgBlackBright(' ethereum fork at ') + chalk.bgBlue(url))
    }

    // Enable 12-second interval mining for dev networks
    process.env.MINING_INTERVAL = '12'

    const execution = argv.execution === 'ganache' ? 'ganache' : 'hardhat'
    if (execution === 'ganache') {
        $`npm run dev:ganache --workspace @casimir/ethereum`
        // Wait for ganache to start
        const ganacheWaitTime = 5000
        await new Promise(resolve => setTimeout(resolve, ganacheWaitTime))
        $`npm run deploy --workspace @casimir/ethereum -- --network ganache`
    } else {
        $`npm run dev --workspace @casimir/ethereum`
        // Wait for hardhat to start
        const hardhatWaitTime = 2500
        await new Promise(resolve => setTimeout(resolve, hardhatWaitTime))
        $`npm run deploy --workspace @casimir/ethereum -- --network localhost`
    }

}()