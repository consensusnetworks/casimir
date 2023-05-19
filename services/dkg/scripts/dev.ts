import { fetchRetry, run } from '@casimir/helpers'

const resourcePath = 'scripts/resources/rockx-dkg-cli'

void async function () {
    process.env.BIP39_PATH_INDEX = '6'
    process.env.MANAGER_ADDRESS = process.env.PUBLIC_MANAGER_ADDRESS
    process.env.CLI_PATH = `./${resourcePath}/build/bin/rockx-dkg-cli`
    process.env.MESSENGER_SRV_ADDR = 'http://0.0.0.0:3000'
    process.env.USE_HARDCODED_OPERATORS = 'true'

    /** Build and check if the CLI is available */
    await run(`make -C ${resourcePath} build`)
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