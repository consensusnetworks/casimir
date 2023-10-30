import { ethers } from 'ethers'
import { loadCredentials, getSecret } from '@casimir/aws'
import { ETHEREUM_CONTRACTS, ETHEREUM_NETWORK_NAME, ETHEREUM_RPC_URL } from '@casimir/env'
import { run } from '@casimir/shell'

/**
 * Test ethereum contracts and services
 */
void async function () {
    if (process.env.USE_SECRETS !== 'false') {
        await loadCredentials()
        process.env.BIP39_SEED = process.env.BIP39_SEED || await getSecret('consensus-networks-bip39-seed') as string
    } else {
        process.env.BIP39_SEED = process.env.BIP39_SEED || 'inflict ball claim confirm cereal cost note dad mix donate traffic patient'
    }
    console.log(`Your mnemonic is ${process.env.BIP39_SEED}`)

    process.env.FORK = process.env.FORK || 'testnet'

    process.env.ETHEREUM_FORK_RPC_URL = ETHEREUM_RPC_URL[process.env.FORK.toUpperCase()]
    if (!process.env.ETHEREUM_FORK_RPC_URL) {
        throw new Error(`Ethereum ${process.env.FORK} is not supported`)
    }

    const networkName = ETHEREUM_NETWORK_NAME[process.env.FORK.toUpperCase()]

    console.log(`Using ${networkName} fork from ${process.env.ETHEREUM_FORK_RPC_URL}`)

    const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_FORK_RPC_URL)
    
    const wallet = ethers.Wallet.fromMnemonic(process.env.BIP39_SEED)

    // Account for the mock, beacon, and library deployments
    const walletNonce = await provider.getTransactionCount(wallet.address) + 13

    if (!process.env.FACTORY_ADDRESS) {
        process.env.FACTORY_ADDRESS = ethers.utils.getContractAddress({
            from: wallet.address,
            nonce: walletNonce
        })
    }

    console.log(`Using factory address ${process.env.FACTORY_ADDRESS}`)

    process.env.SSV_NETWORK_ADDRESS = ETHEREUM_CONTRACTS[process.env.FORK.toUpperCase()]?.SSV_NETWORK_ADDRESS
    process.env.SSV_VIEWS_ADDRESS = ETHEREUM_CONTRACTS[process.env.FORK.toUpperCase()]?.SSV_VIEWS_ADDRESS
    process.env.SWAP_FACTORY_ADDRESS = ETHEREUM_CONTRACTS[process.env.FORK.toUpperCase()]?.SWAP_FACTORY_ADDRESS

    await run('npm run generate --workspace @casimir/oracle')
    run('npm run test --workspace @casimir/ethereum')
}()
