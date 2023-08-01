import os from 'os'
import fs from 'fs'
import { ethers } from 'ethers'
import { fetchRetry, run } from '@casimir/helpers'
import { Validator } from '@casimir/types'
import { Dkg } from '../src/providers/dkg'

void async function () {

    const outputPath = '../../contracts/ethereum/scripts/.out'
    const resourcePath = 'scripts/resources'

    process.env.BIP39_SEED = process.env.BIP39_SEED || 'test test test test test test test test test test test junk'
    process.env.CLI_PATH = `./${resourcePath}/rockx-dkg-cli/build/bin/rockx-dkg-cli`
    process.env.MESSENGER_SRV_ADDR = 'http://0.0.0.0:3000'
    process.env.USE_HARDCODED_OPERATORS = 'true'
    if (!process.env.MANAGER_ADDRESS) throw new Error('No manager address set')
    if (!process.env.VIEWS_ADDRESS) throw new Error('No views address set')
    process.env.LINK_TOKEN_ADDRESS = '0x326C977E6efc84E512bB9C30f76E30c160eD06FB'
    process.env.SSV_NETWORK_ADDRESS = '0xAfdb141Dd99b5a101065f40e3D7636262dce65b3'
    process.env.SSV_NETWORK_VIEWS_ADDRESS = '0x8dB45282d7C4559fd093C26f677B3837a5598914'
    process.env.SSV_TOKEN_ADDRESS = '0x3a9f01091C446bdE031E39ea8354647AFef091E7'
    process.env.UNISWAP_V3_FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
    process.env.WETH_TOKEN_ADDRESS = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'

    const wallet = ethers.Wallet.fromMnemonic(process.env.BIP39_SEED, 'm/44\'/60\'/0\'/0/6')
    const oracleAddress = wallet.address

    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath)
    }

    if (!fs.existsSync(`${outputPath}/validators.json`)) {
        fs.writeFileSync(`${outputPath}/validators.json`, JSON.stringify({}))
    }

    const validatorCount = parseInt(process.env.VALIDATOR_COUNT as string) || 4
    const validators = JSON.parse(fs.readFileSync(`${outputPath}/validators.json`, 'utf8') || '{}')
    if (!validators[oracleAddress] || Object.keys(validators[oracleAddress]).length < validatorCount) {
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

        let nonce = 3

        const newValidators: Validator[] = []

        for (let i = 0; i < validatorCount; i++) {

            const poolAddress = ethers.utils.getContractAddress({
                from: process.env.MANAGER_ADDRESS,
                nonce
            })

            const newOperatorIds = [1, 2, 3, 4] // Todo get new group here
            
            const cli = new Dkg({ 
                cliPath: process.env.CLI_PATH, 
                messengerUrl: process.env.MESSENGER_SRV_ADDR 
            })

            const validator = await cli.createValidator({
                poolId: i + 1,
                operatorIds: newOperatorIds,
                withdrawalAddress: poolAddress
            })

            newValidators.push(validator)

            nonce++
        }

        validators[oracleAddress] = newValidators

        fs.writeFileSync(`${outputPath}/validators.json`, JSON.stringify(validators, null, 4))

        await run('npm run clean --workspace @casimir/oracle')
    }
}()