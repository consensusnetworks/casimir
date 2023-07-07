import { ethers } from 'ethers'
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

    /** Load AWS credentials for getting secrets */
    if (process.env.USE_SECRETS !== 'false') {
        await loadCredentials()
    }

    /** Get wallet seed */
    process.env.BIP39_SEED = process.env.USE_SECRETS !== 'false' ? process.env.BIP39_SEED || await getSecret('consensus-networks-bip39-seed') : process.env.BIP39_SEED || 'test test test test test test test test test test test junk'

    /** Default to testnet */
    process.env.FORK = process.env.FORK || 'testnet'

    /** Default to no tunneling */
    process.env.TUNNEL = process.env.TUNNEL || 'false'

    /** Default to run mock oracle */
    process.env.MOCK_ORACLE = process.env.MOCK_ORACLE || 'true'

    /** Set 12 second mining interval */
    process.env.MINING_INTERVAL = '12'

    /** Set local ethereum RPC url */
    process.env.ETHEREUM_RPC_URL = 'http://127.0.0.1:8545'

    echo(chalk.bgBlackBright('Your mnemonic seed is ') + chalk.bgBlue(process.env.BIP39_SEED))

    /** Require fork to be supported */
    if (!forks[process.env.FORK]) {
        throw new Error(`No fork ${process.env.FORK} supported.`)
    }

    /** Get local ethereum fork RPC url */
    if (process.env.USE_SECRETS !== 'false') {
        const key = await getSecret(`consensus-networks-ethereum-${forks[process.env.FORK]}`)
        process.env.ETHEREUM_FORK_RPC_URL = process.env.ETHEREUM_FORK_RPC_URL || `https://eth-${forks[process.env.FORK]}.g.alchemy.com/v2/${key}`
    }
    
    /** Require ethereum fork RPC url */
    if (!process.env.ETHEREUM_FORK_RPC_URL) {
        throw new Error(`No ETHEREUM_FORK_RPC_URL set for ${process.env.FORK} ${forks[process.env.FORK]} network.`)
    }

    echo (chalk.bgBlackBright('Using ') + chalk.bgBlue(process.env.FORK) + chalk.bgBlackBright(' fork from ') + chalk.bgBlue(process.env.ETHEREUM_FORK_RPC_URL))
    echo (chalk.bgBlackBright('Serving local fork at ') + chalk.bgBlue(process.env.ETHEREUM_RPC_URL))

    const wallet = getWallet(process.env.BIP39_SEED)
    const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_FORK_RPC_URL)
    const nonce = await provider.getTransactionCount(wallet.address)
    const managerIndex = 1 // We deploy a mock functions oracle before the manager
    if (!process.env.MANAGER_ADDRESS) {
        process.env.MANAGER_ADDRESS = await getFutureContractAddress({ wallet, nonce, index: managerIndex })
    }
    if (!process.env.VIEWS_ADDRESS) {
        process.env.VIEWS_ADDRESS = await getFutureContractAddress({ wallet, nonce, index: managerIndex + 1 })
    }

    $`npm run node --workspace @casimir/ethereum`
    const hardhatWaitTime = 2500
    await new Promise(resolve => setTimeout(resolve, hardhatWaitTime))
    $`npm run dev --workspace @casimir/ethereum -- --network localhost`

    if (process.env.MOCK_ORACLE === 'true') {
        process.on('SIGINT', () => {
            const messes = ['oracle']
            const cleaners = messes.map(mess => `npm run clean --workspace @casimir/${mess}`).join(' & ')
            if (cleaners.length) {
                console.log(`\n🧹 Cleaning up: ${messes.map(mess => `@casimir/${mess}`).join(', ')}`)
                runSync(`${cleaners}`)
            }
            process.exit()
        })
    }
}()