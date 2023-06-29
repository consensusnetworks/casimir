import { $, echo, chalk } from 'zx'
import { loadCredentials, getSecret, getFutureContractAddress, getWallet, runSync } from '@casimir/helpers'

/**
 * Run local a local Ethereum node and deploy contracts
 * 
 * For more info see:
 *      - https://hardhat.org/hardhat-network/docs/overview
 */
void async function () {

    const forks = {
        mainnet: 'mainnet',
        testnet: 'goerli'
    }

    /** Chain fork nonces */
    const nonces = {
        mainnet: 0,
        goerli: 12
    }

    /** Load AWS credentials for configuration */
    await loadCredentials()

    /** Default to clean services and data */
    process.env.CLEAN = process.env.CLEAN || 'true'

    /** Default to testnet */
    process.env.FORK = process.env.FORK || 'testnet'

    /** Default to stubbed oracle service handlers */
    process.env.MOCK_ORACLE = process.env.MOCK_ORACLE || 'false'

    process.env.MINING_INTERVAL = '12'
    process.env.ETHEREUM_RPC_URL = 'http://localhost:8545'

    process.env.BIP39_SEED = await getSecret('consensus-networks-bip39-seed')
    const wallet = getWallet(process.env.BIP39_SEED)
    const nonce = nonces[forks[process.env.FORK]]
    const managerIndex = 1 // We deploy a mock functions oracle before the manager
    if (!process.env.PUBLIC_MANAGER_ADDRESS) {
        const managerAddress = await getFutureContractAddress({ wallet, nonce, index: managerIndex })
        process.env.PUBLIC_MANAGER_ADDRESS = `${managerAddress}`
    }
    if (!process.env.PUBLIC_VIEWS_ADDRESS) {
        const viewsAddress = await getFutureContractAddress({ wallet, nonce, index: managerIndex + 1 })
        process.env.PUBLIC_VIEWS_ADDRESS = `${viewsAddress}`
    }
    echo(chalk.bgBlackBright('Your mnemonic seed is ') + chalk.bgBlue(process.env.BIP39_SEED))

    if (forks[process.env.FORK]) {
        const key = await getSecret(`consensus-networks-ethereum-${forks[process.env.FORK]}`)
        const url = `https://eth-${forks[process.env.FORK]}.g.alchemy.com/v2/${key}`
        process.env.ETHEREUM_FORKING_URL = url
        echo(chalk.bgBlackBright('Using ') + chalk.bgBlue(forks[process.env.FORK]) + chalk.bgBlackBright(' ethereum fork at ') + chalk.bgBlue(url))
    }

    $`npm run node --workspace @casimir/ethereum`
    const hardhatWaitTime = 2500
    await new Promise(resolve => setTimeout(resolve, hardhatWaitTime))
    $`npm run dev --workspace @casimir/ethereum -- --network localhost`

    if (process.env.MOCK_ORACLE === 'true') {
        $`npm run dev --workspace @casimir/oracle`
        process.on('SIGINT', () => {
            const messes = ['oracle']
            if (process.env.CLEAN === 'true') {
                const cleaners = messes.map(mess => `npm run clean --workspace @casimir/${mess}`).join(' & ')
                console.log(`\n🧹 Cleaning up: ${messes.map(mess => `@casimir/${mess}`).join(', ')}`)
                runSync(`${cleaners}`)
            }
            process.exit()
        })
    }
}()