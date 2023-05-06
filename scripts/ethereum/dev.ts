import { $, echo, chalk } from 'zx'
import { loadCredentials, getSecret, getFutureContractAddress, getWallet } from '@casimir/helpers'
import minimist from 'minimist'

/**
 * Run local a local Ethereum node and deploy contracts
 * 
 * Arguments:
 *      --clean: whether to clean build directory (override default true)
 *      --execution: hardhat or gananche (override default hardhat)
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

    /** Default to no clean */
    const clean = argv.clean === 'true' || argv.clean === true

    /** Set execution environment */
    const execution = argv.execution === 'ganache' ? 'ganache' : 'hardhat'

    /** Set fork rpc if requested, default fork to goerli if set vaguely or unset */
    const fork = argv.fork === 'true' ? 'goerli' : argv.fork === 'false' ? false : argv.fork ? argv.fork : 'goerli'

    /** Default to mock external contracts */
    const mock = argv.mock !== 'false' && argv.mock !== false

    /** Get manager address based on shared seed nonce */
    const seed = await getSecret('consensus-networks-bip39-seed')
    if (!process.env.PUBLIC_MANAGER_ADDRESS) {
        const wallet = getWallet(seed)
        const nonce = nonces[fork]
        const managerIndex = 1 // We deploy a mock oracle before the manager
        const managerAddress = await getFutureContractAddress({ wallet, nonce, index: managerIndex })
        process.env.PUBLIC_MANAGER_ADDRESS = `${managerAddress}`
    }
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
    
    /** Set 12-second interval mining for dev networks */
    process.env.MINING_INTERVAL = '12'

    /** Set mock */
    process.env.MOCK_EXTERNAL_CONTRACTS = `${mock}`

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

    /** Start local oracle */
    process.env.ETHEREUM_RPC_URL = 'http://localhost:8545'
    $`npm run dev --workspace @casimir/oracle`
}()