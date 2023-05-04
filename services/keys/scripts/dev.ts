import { retryFetch } from '@casimir/helpers'
import { $ } from 'zx'

// Todo just start services and import/run the desired command (dev CLI, no prod CLI)

process.env.PUBLIC_MANAGER_ADDRESS = '0xaaf5751d370d2fD5F1D5642C2f88bbFa67a29301'

void async function () {
    await $`npx esno -r dotenv/config src/index.ts help`

    const dkgServiceUrl = 'http://0.0.0.0:3000'
    const groups = [[1, 2, 3, 4], [1, 2, 3, 4]]
    process.env.MESSENGER_SRV_ADDR = dkgServiceUrl
    process.env.USE_HARDCODED_OPERATORS ='true'

    /** Start the DKG service */
    await $`docker compose -f scripts/resources/rockx-dkg-cli/docker-compose.yaml up -d`

    /** Ping the DGK service for a pong */
    const ping = await retryFetch(`${dkgServiceUrl}/ping`)
    const { message } = await ping.json()
    if (message !== 'pong') throw new Error('DKG service is not running')

    await Promise.all(groups.map(async (group) => {
        console.log(`Starting ceremony for operators: ${group.join(',')}`)
        await $`npx esno -r dotenv/config src/index.ts create-validator --dkgServiceUrl ${dkgServiceUrl} --operatorIds ${group.join(',')}`
        console.log('Completed ceremony...')
    }))

    /** Stop the DKG service */
    await $`docker compose -f scripts/resources/rockx-dkg-cli/docker-compose.yaml down`
}()