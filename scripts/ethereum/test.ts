import { ethers } from 'ethers'
import { $, chalk, echo } from 'zx'
import { loadCredentials, getSecret, getWallet, run } from '@casimir/helpers'

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

    if (process.env.USE_SECRETS !== 'false') {
        await loadCredentials()
    }

    process.env.FORK = process.env.FORK || 'testnet'

    process.env.BIP39_SEED = process.env.USE_SECRETS !== 'false' ? process.env.BIP39_SEED || await getSecret('consensus-networks-bip39-seed') : process.env.BIP39_SEED || 'test test test test test test test test test test test junk'

    echo(chalk.bgBlackBright('Your mnemonic is ') + chalk.bgBlue(process.env.BIP39_SEED))

    process.env.ETHEREUM_RPC_URL = 'http://127.0.0.1:8545'

    if (!forks[process.env.FORK]) {
        throw new Error(`No fork ${process.env.FORK} supported.`)
    }

    if (process.env.USE_SECRETS !== 'false') {
        const key = await getSecret(`consensus-networks-ethereum-${forks[process.env.FORK]}`)
        process.env.ETHEREUM_FORK_RPC_URL = process.env.ETHEREUM_FORK_RPC_URL || `https://eth-${forks[process.env.FORK]}.g.alchemy.com/v2/${key}`
    }

    if (!process.env.ETHEREUM_FORK_RPC_URL) {
        throw new Error(`No ETHEREUM_FORK_RPC_URL set for ${process.env.FORK} ${forks[process.env.FORK]} network.`)
    }

    echo(chalk.bgBlackBright('Using ') + chalk.bgBlue(process.env.FORK) + chalk.bgBlackBright(' fork from ') + chalk.bgBlue(process.env.ETHEREUM_FORK_RPC_URL))

    const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_FORK_RPC_URL)
    process.env.ETHEREUM_FORK_BLOCK = process.env.ETHEREUM_FORK_BLOCK || `${await provider.getBlockNumber() - 5}`
    console.log(`📍 Forking started at ${process.env.ETHEREUM_FORK_BLOCK}`)

    const wallet = getWallet(process.env.BIP39_SEED)
    
    // Account for the mock oracle contract deployment
    const deployerNonce = await provider.getTransactionCount(wallet.address) + 1

    if (!process.env.MANAGER_ADDRESS) {
        process.env.MANAGER_ADDRESS = ethers.utils.getContractAddress({
            from: wallet.address,
            nonce: deployerNonce
        })
    }
    if (!process.env.VIEWS_ADDRESS) {
        process.env.VIEWS_ADDRESS = ethers.utils.getContractAddress({
            from: wallet.address,
            nonce: deployerNonce + 1
        })
    }
    if (!process.env.REGISTRY_ADDRESS) {
        process.env.REGISTRY_ADDRESS = ethers.utils.getContractAddress({
            from: process.env.MANAGER_ADDRESS,
            nonce: 1
        })
    }
    if (!process.env.UPKEEP_ADDRESS) {
        process.env.UPKEEP_ADDRESS = ethers.utils.getContractAddress({
            from: process.env.MANAGER_ADDRESS,
            nonce: 2
        })
    }

    process.env.SSV_NETWORK_ADDRESS = process.env.SSV_NETWORK_ADDRESS || '0xAfdb141Dd99b5a101065f40e3D7636262dce65b3'
    process.env.SSV_NETWORK_VIEWS_ADDRESS = process.env.SSV_NETWORK_VIEWS_ADDRESS || '0x8dB45282d7C4559fd093C26f677B3837a5598914'
    process.env.UNISWAP_V3_FACTORY_ADDRESS = process.env.UNISWAP_V3_FACTORY_ADDRESS || '0x1F98431c8aD98523631AE4a59f267346ea31F984'

    await run('npm run generate --workspace @casimir/oracle')

    $`npm run test --workspace @casimir/ethereum`
}()
