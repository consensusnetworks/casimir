import { retryFetch } from '@casimir/helpers'
import { $ } from 'zx'

void async function () {
    process.env.MESSENGER_SRV_ADDR = 'http://0.0.0.0:3000'
    process.env.USE_HARDCODED_OPERATORS ='true'

    /** Start the DKG service */
    await $`docker compose -f scripts/resources/rockx-dkg-cli/docker-compose.yaml up -d`

    /** Ping the DGK service for a pong */
    const ping = await retryFetch(`${process.env.MESSENGER_SRV_ADDR}/ping`)
    const { message } = await ping.json()
    if (message !== 'pong') throw new Error('DKG service is not running')

    $`npx esno -r dotenv/config src/index.ts`
}()