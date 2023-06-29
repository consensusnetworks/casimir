import { $, chalk, echo } from 'zx'
import { loadCredentials, getSecret } from '@casimir/helpers'

/**
 * Test Ethereum contracts
 * 
 * For more info see:
 *      - https://hardhat.org/hardhat-network/docs/overview
 */
void async function () {

    const forks = {
        mainnet: 'mainnet',
        testnet: 'goerli'
    }

    /** Load AWS credentials for configuration */
    await loadCredentials()

    /** Default to no clean */
    process.env.CLEAN = process.env.CLEAN || 'false'

    /** Default to testnet */
    process.env.FORK = process.env.FORK || 'testnet'

    /** Get shared seed */
    const seed = await getSecret('consensus-networks-bip39-seed')

    process.env.BIP39_SEED = seed
    echo(chalk.bgBlackBright('Your mnemonic is ') + chalk.bgBlue(seed))

    if (forks[process.env.FORK]) {
        const key = await getSecret(`consensus-networks-ethereum-${forks[process.env.FORK]}`)
        const url = `https://eth-${forks[process.env.FORK]}.g.alchemy.com/v2/${key}`
        process.env.ETHEREUM_FORKING_URL = url
        echo(chalk.bgBlackBright('Using ') + chalk.bgBlue(forks[process.env.FORK]) + chalk.bgBlackBright(' fork at ') + chalk.bgBlue(url))
    }

    if (process.env.CLEAN === 'true') {
        $`npm run clean --workspace @casimir/ethereum`
    }

    $`npm run test --workspace @casimir/ethereum`
}()
