import { fetchRetry, run } from '@casimir/helpers'
import path from 'path'

const resourcePath = 'scripts/resources/rockx-dkg-cli'

void async function () {
    process.env.BIP39_SEED = process.env.BIP39_SEED || 'test test test test test test test test test test test junk'
    process.env.BIP39_PATH_INDEX = process.env.BIP39_PATH_INDEX || '6'
    if (!process.env.MANAGER_ADDRESS) throw new Error('Manager address not found')
    console.log(`🔑 Manager address: ${process.env.MANAGER_ADDRESS}`)
    if (!process.env.VIEWS_ADDRESS) throw new Error('Views address not found')
    console.log(`🔑 Views address: ${process.env.VIEWS_ADDRESS}`)
    process.env.LINK_TOKEN_ADDRESS = '0x326C977E6efc84E512bB9C30f76E30c160eD06FB'
    process.env.SSV_TOKEN_ADDRESS = '0x3a9f01091C446bdE031E39ea8354647AFef091E7'
    process.env.WETH_TOKEN_ADDRESS = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
    process.env.CLI_PATH = `./${resourcePath}/build/bin/rockx-dkg-cli`
    process.env.MESSENGER_SRV_ADDR = 'http://0.0.0.0:3000'
    process.env.USE_HARDCODED_OPERATORS = 'true'

    /** Build and check if the CLI is available */
    await run(`make -C ${path.resolve(resourcePath)} build`)
    const cli = await run(`which ${process.env.CLI_PATH}`)
    if (!cli) throw new Error('DKG CLI not found')

    /** Start the DKG service */
    await run(`docker compose -f ${resourcePath}/docker-compose.yaml up -d`)
    console.log('🔑 DKG service started')

    /** Ping the DGK service for a pong */
    const ping = await fetchRetry(`${process.env.MESSENGER_SRV_ADDR}/ping`)
    const { message } = await ping.json()
    if (message !== 'pong') throw new Error('DKG service is not running')

    run('npx esno -r dotenv/config src/index.ts')
}()