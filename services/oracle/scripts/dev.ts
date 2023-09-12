import { fetchRetry } from '@casimir/fetch'
import { run } from '@casimir/shell'

/**
 * Start development DAO oracle service
 */
void async function () {
    const resourceDir = 'scripts/resources'

    process.env.CLI_PATH = process.env.CLI_PATH || `./${resourceDir}/rockx-dkg-cli/build/bin/rockx-dkg-cli`
    process.env.MESSENGER_URL = process.env.MESSENGER_URL || 'https://nodes.casimir.co/eth/goerli/dkg/messenger'
    process.env.MESSENGER_SRV_ADDR = process.env.MESSENGER_URL
    process.env.USE_HARDCODED_OPERATORS = 'false'

    process.env.BIP39_SEED = process.env.BIP39_SEED || 'inflict ball claim confirm cereal cost note dad mix donate traffic patient'
    process.env.BIP39_PATH_INDEX = process.env.BIP39_PATH_INDEX || '6'
    if (!process.env.MANAGER_ADDRESS) throw new Error('No manager address provided')
    if (!process.env.VIEWS_ADDRESS) throw new Error('No views address provided')
    if (!process.env.REGISTRY_ADDRESS) throw new Error('No registry address provided')
    if (!process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS) throw new Error('No functions billing registry address provided')
    if (!process.env.KEEPER_REGISTRY_ADDRESS) throw new Error('No link registry address provided')
    process.env.LINK_TOKEN_ADDRESS = '0x326C977E6efc84E512bB9C30f76E30c160eD06FB'
    process.env.SSV_NETWORK_ADDRESS = '0xC3CD9A0aE89Fff83b71b58b6512D43F8a41f363D'
    process.env.SSV_VIEWS_ADDRESS = '0xAE2C84c48272F5a1746150ef333D5E5B51F68763'
    process.env.SSV_TOKEN_ADDRESS = '0x3a9f01091C446bdE031E39ea8354647AFef091E7'
    process.env.UNISWAP_V3_FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
    process.env.WETH_TOKEN_ADDRESS = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'

    const dkg = await run(`which ${process.env.CLI_PATH}`) as string
    if (!dkg || dkg.includes('not found')) {
        await run(`GOWORK=off make -C ${resourceDir}/rockx-dkg-cli build`)
    }
    const ping = await fetchRetry(`${process.env.MESSENGER_URL}/ping`)
    const { message } = await ping.json()
    if (message !== 'pong') throw new Error('Dkg service is not running')

    run('npx esno -r dotenv/config src/index.ts')
    console.log('🔮 Oracle service started')
}()