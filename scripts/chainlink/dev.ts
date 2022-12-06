import { $, argv, fs } from 'zx'
import { getSecret } from '@casimir/aws-helpers'
import { getAddress, getKeystore } from '@casimir/ethers-helpers'

/**
 * Run local a local Chainlink node and fulfill requests
 * 
 * Arguments:
 *      --fork: mainnet, goerli, true, or false (override default goerli)
 * 
 * For more info see:
 *      - https://hardhat.org/hardhat-network/docs/overview
 */
void async function () {
    process.env.DOCKER_BUILDKIT = '1'
    process.env.COMPOSE_DOCKER_CLI_BUILD = '1'
    if (!process.env.EXPLORER_DOCKER_TAG) {
        process.env.EXPLORER_DOCKER_TAG = 'develop'
    }

    // Get shared seed
    const seed = await getSecret('consensus-networks-bip39-seed')
    process.env.BIP39_SEED = seed

    const address = await getAddress(seed)
    process.env.CHAINLINK_OWNER_ADDRESS = address

    const keystore = await getKeystore(seed)
    await fs.writeJSON(`scripts/chainlink/secrets/${address}.json`, keystore, { spaces: '\t' })

    const fork = argv.fork === 'true' ? 'goerli' : argv.fork === 'false' ? false : argv.fork ? argv.fork : 'goerli'
    if (fork) {
        const forkingChainId = { mainnet: 1, goerli: 5 }[fork]
        process.env.ETH_CHAIN_ID = `${forkingChainId}`
    } else {
        process.env.ETH_CHAIN_ID = '1337'
    }

    // $`docker compose up`

}()