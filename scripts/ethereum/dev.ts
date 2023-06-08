import { $, echo, chalk } from 'zx'
import { loadCredentials, getSecret, getFutureContractAddress, getWallet, runSync } from '@casimir/helpers'
import minimist from 'minimist'

/**
 * Run local a local Ethereum node and deploy contracts
 * 
 * Arguments:
 *      --clean: whether to clean build directory (override default true)
 *      --fork: mainnet, goerli, true, or false (override default goerli)
 *      --mock: whether to use mock contracts (override default true)
 * 
 * For more info see:
 *      - https://hardhat.org/hardhat-network/docs/overview
 */
void async function () {

    /** Chain fork nonces */
    const nonces = {
        mainnet: 0,
        goerli: 12
    }

    /** Load AWS credentials for configuration */
    await loadCredentials()
    
    /** Parse command line arguments */
    const argv = minimist(process.argv.slice(2))

    /** Default to clean services and data */
    const clean = argv.clean !== 'false' || argv.clean !== false

    /** Set fork rpc if requested, default fork to goerli if set vaguely or unset */
    const fork = argv.fork === 'true' ? 'goerli' : argv.fork === 'false' ? false : argv.fork ? argv.fork : 'goerli'

    /** Default to mock external services */
    const mock = argv.mock !== 'false' && argv.mock !== false

    process.env.MOCK_ORACLE = `${mock}`
    process.env.MINING_INTERVAL = '12'

    const seed = await getSecret('consensus-networks-bip39-seed')
    if (!process.env.PUBLIC_MANAGER_ADDRESS) {
        const wallet = getWallet(seed)
        const nonce = nonces[fork]
        const managerIndex = 1 // We deploy a mock oracle before the manager
        const managerAddress = await getFutureContractAddress({ wallet, nonce, index: managerIndex })
        process.env.PUBLIC_MANAGER_ADDRESS = `${managerAddress}`
    }
    if (!process.env.PUBLIC_VIEWS_ADDRESS) {
        const wallet = getWallet(seed)
        const nonce = nonces[fork]
        const viewsIndex = 2 // We deploy a mock oracle before the manager
        const viewsAddress = await getFutureContractAddress({ wallet, nonce, index: viewsIndex })
        process.env.PUBLIC_VIEWS_ADDRESS = `${viewsAddress}`
    }
    process.env.BIP39_SEED = seed
    echo(chalk.bgBlackBright('Your mnemonic seed is ') + chalk.bgBlue(seed))

    if (fork) {
        const key = await getSecret(`consensus-networks-ethereum-${fork}`)
        const url = `https://eth-${fork}.g.alchemy.com/v2/${key}`
        process.env.ETHEREUM_FORKING_URL = url
        echo(chalk.bgBlackBright('Using ') + chalk.bgBlue(fork) + chalk.bgBlackBright(' ethereum fork at ') + chalk.bgBlue(url))
    }

    $`npm run node --workspace @casimir/ethereum`
    const hardhatWaitTime = 2500
    await new Promise(resolve => setTimeout(resolve, hardhatWaitTime))
    $`npm run dev --workspace @casimir/ethereum -- --network localhost`

    if (!mock) {
        process.env.ETHEREUM_RPC_URL = 'http://localhost:8545'
        $`npm run dev --workspace @casimir/oracle`
        process.on('SIGINT', () => {
            const messes = ['oracle']
            if (clean) {
                const cleaners = messes.map(mess => `npm run clean --workspace @casimir/${mess}`).join(' & ')
                console.log(`\n🧹 Cleaning up: ${messes.map(mess => `@casimir/${mess}`).join(', ')}`)
                runSync(`${cleaners}`)
            }
            process.exit()
        })
    }
}()