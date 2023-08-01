import os from 'os'
import { fetchRetry, run } from '@casimir/helpers'

const resourcePath = 'scripts/resources'

void async function () {
    process.env.BIP39_SEED = process.env.BIP39_SEED || 'test test test test test test test test test test test junk'
    process.env.BIP39_PATH_INDEX = process.env.BIP39_PATH_INDEX || '6'
    if (!process.env.MANAGER_ADDRESS) throw new Error('Manager address not found')
    if (!process.env.VIEWS_ADDRESS) throw new Error('Views address not found')
    process.env.LINK_TOKEN_ADDRESS = '0x326C977E6efc84E512bB9C30f76E30c160eD06FB'
    process.env.SSV_NETWORK_ADDRESS = '0xAfdb141Dd99b5a101065f40e3D7636262dce65b3'
    process.env.SSV_NETWORK_VIEWS_ADDRESS = '0x8dB45282d7C4559fd093C26f677B3837a5598914'
    process.env.SSV_TOKEN_ADDRESS = '0x3a9f01091C446bdE031E39ea8354647AFef091E7'
    process.env.UNISWAP_V3_FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
    process.env.WETH_TOKEN_ADDRESS = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'
    process.env.CLI_STRATEGY = 'dkg'

    if (process.env.CLI_STRATEGY === 'dkg') {
        process.env.CLI_PATH = `./${resourcePath}/rockx-dkg-cli/build/bin/rockx-dkg-cli`
        process.env.MESSENGER_SRV_ADDR = 'http://0.0.0.0:3000'
        process.env.USE_HARDCODED_OPERATORS = 'true'
        await run(`make -C ${resourcePath}/rockx-dkg-cli build`)
        const dkg = await run(`which ${process.env.CLI_PATH}`) as string
        if (!dkg || dkg.includes('not found')) throw new Error('Dkg cli not found')
        if (os.platform() === 'linux') {
            await run(`docker compose -f ${resourcePath}/rockx-dkg-cli/docker-compose.yaml -f ${resourcePath}/../docker-compose.override.yaml up -d`)
        } else {
            await run(`docker compose -f ${resourcePath}/rockx-dkg-cli/docker-compose.yaml up -d`)
        }
        const ping = await fetchRetry(`${process.env.MESSENGER_SRV_ADDR}/ping`)
        const { message } = await ping.json()
        if (message !== 'pong') throw new Error('Dkg service is not running')
        console.log('🔑 Dkg service ready')
    } else {
        process.env.CLI_PATH = 'docker run -it ethdo'
        await run('docker pull wealdtech/ethdo && docker build -t ethdo .')
        console.log('🔑 Ethdo service ready')
    }

    run('npx esno -r dotenv/config src/index.ts')
    console.log('🔮 Oracle service started')
}()