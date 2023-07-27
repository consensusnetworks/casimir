import os from 'os'
import fs from 'fs'
import { ethers } from 'ethers'
import { fetchRetry, run } from '@casimir/helpers'
import { Dkg } from '@casimir/oracle/src/providers/dkg'
import { Validator } from '@casimir/types'

void async function () {

    const outputPath = '../../contracts/ethereum/scripts/.out'
    const resourcePath = 'scripts/resources'

    process.env.BIP39_SEED = process.env.BIP39_SEED || 'test test test test test test test test test test test junk'
    process.env.CLI_PATH = `./${resourcePath}/rockx-dkg-cli/build/bin/rockx-dkg-cli`
    process.env.MESSENGER_SRV_ADDR = 'http://0.0.0.0:3000'
    process.env.USE_HARDCODED_OPERATORS = 'true'

    if (!process.env.MANAGER_ADDRESS) {
        throw new Error('No MANAGER_ADDRESS set')
    }

    if (!process.env.VIEWS_ADDRESS) {
        throw new Error('No VIEWS_ADDRESS set')
    }

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
        await run(`make -C ${resourcePath}/rockx-dkg-cli build`)
        const cli = await run(`which ${process.env.CLI_PATH}`)
        if (!cli) throw new Error('Dkg cli not found')
        if (os.platform() === 'linux') {
            await run(`docker compose -f ${resourcePath}/rockx-dkg-cli/docker-compose.yaml -f ${resourcePath}/../docker-compose.override.yaml up -d`)
        } else {
            await run(`docker compose -f ${resourcePath}/rockx-dkg-cli/docker-compose.yaml up -d`)
        }        
        const ping = await fetchRetry(`${process.env.MESSENGER_SRV_ADDR}/ping`)
        const { message } = await ping.json()
        if (message !== 'pong') throw new Error('Dkg service is not running')
        console.log('🔑 Dkg service started')

        let nonce = 3

        const newValidators: Validator[] = []

        for (let i = 0; i < validatorCount; i++) {

            const poolAddress = ethers.utils.getContractAddress({
                from: process.env.MANAGER_ADDRESS,
                nonce
            })

            const newOperatorIds = [1, 2, 3, 4] // Todo get new group here
            const dkg = new Dkg({ cliPath: process.env.CLI_PATH, messengerUrl: process.env.MESSENGER_SRV_ADDR })

            const validator = await dkg.createValidator({
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