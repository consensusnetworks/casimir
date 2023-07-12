import fs from 'fs'
import { ethers } from 'ethers'
import { $, chalk, echo } from 'zx'
import { loadCredentials, getSecret, runSync, getWallet, getFutureContractAddress, run } from '@casimir/helpers'

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

    /** Load AWS credentials for getting secrets */
    if (process.env.USE_SECRETS !== 'false') {
        await loadCredentials()
    }

    /** Default to testnet */
    process.env.FORK = process.env.FORK || 'testnet'

    /** Get wallet seed */
    process.env.BIP39_SEED = process.env.USE_SECRETS !== 'false' ? process.env.BIP39_SEED || await getSecret('consensus-networks-bip39-seed') : process.env.BIP39_SEED || 'test test test test test test test test test test test junk'

    echo(chalk.bgBlackBright('Your mnemonic is ') + chalk.bgBlue(process.env.BIP39_SEED))

    /** Set local ethereum RPC url */
    process.env.ETHEREUM_RPC_URL = 'http://127.0.0.1:8545'

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
    
    /** Generate mock validators as needed */
    await run('npm run generate --workspace @casimir/oracle')

    $`npm run test --workspace @casimir/ethereum`
}()
