import { $, argv } from 'zx'
import { parseStdout } from '@casimir/zx-helpers'

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
    process.env.EXPLORER_DOCKER_TAG = 'develop'
    process.env.SKIP_DATABASE_PASSWORD_COMPLEXITY_CHECK = 'true'
    process.env.ETH_URL = 'ws://host.docker.internal:8545'
    process.env.CHAINLINK_TLS_PORT = '0'
    process.env.SECURE_COOKIES = 'false'
    process.env.ALLOW_ORIGINS = '*'
    process.env.NODE_NO_NEW_HEADS_THRESHOLD = '0'

    const fork = argv.fork === 'true' ? 'goerli' : argv.fork === 'false' ? false : argv.fork ? argv.fork : 'goerli'
    if (fork) {
        const forkingChainId = { mainnet: 1, goerli: 5 }[fork]
        process.env.ETH_CHAIN_ID = `${forkingChainId}`
    } else {
        process.env.ETH_CHAIN_ID = '1337'
    }

    try {
        await $`docker compose -f scripts/chainlink/docker-compose.yml down`
    } catch {
        console.log('Docker is ready.')
    }
    $`docker compose -f scripts/chainlink/docker-compose.yml up`

    // const matcherPort = 8000
    // process.env.PUBLIC_MATCHER_PORT = `${matcherPort}`
    // try {
    //     if (parseStdout(await $`lsof -ti:${matcherPort}`)) {
    //         $`kill -9 $(lsof -ti:${matcherPort})`
    //     }
    // } catch {
    //     console.log(`Port ${matcherPort} is available.`)
    // }

    // $`npm run dev --workspace @casimir/matcher`

}()