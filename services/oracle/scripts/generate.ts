import fs from 'fs'
import { ethers } from 'ethers'
import { fetchRetry, run } from '@casimir/helpers'
import { DKG } from '@casimir/oracle/src/providers/dkg'
import { Validator } from '@casimir/types'

void async function () {

    const outputPath = '../../contracts/ethereum/scripts/.out'
    const resourcePath = 'scripts/resources/rockx-dkg-cli'

    process.env.BIP39_SEED = process.env.BIP39_SEED || 'test test test test test test test test test test test junk'
    process.env.CLI_PATH = `./${resourcePath}/build/bin/rockx-dkg-cli`
    process.env.MESSENGER_SRV_ADDR = 'http://0.0.0.0:3000'
    process.env.USE_HARDCODED_OPERATORS = 'true'

    if (!process.env.MANAGER_ADDRESS) {
        throw new Error('No MANAGER_ADDRESS set')
    }

    if (!process.env.VIEWS_ADDRESS) {
        throw new Error('No VIEWS_ADDRESS set')
    }

    /** Get the oracle wallet address */
    const wallet = ethers.Wallet.fromMnemonic(process.env.BIP39_SEED, 'm/44\'/60\'/0\'/0/6')
    const oracleAddress = wallet.address

    /** Create mock validators output path if it doesn't exist */
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath)
    }

    if (!fs.existsSync(`${outputPath}/validators.json`)) {
        fs.writeFileSync(`${outputPath}/validators.json`, JSON.stringify({}))
    }

    /** Get the number of validators required */
    const validatorCount = parseInt(process.env.VALIDATOR_COUNT as string) || 4

    /** Read current mock validators file */
    const validators = JSON.parse(fs.readFileSync(`${outputPath}/validators.json`, 'utf8') || '{}')

    /** Check if the oracle has enough validators */
    if (!validators[oracleAddress] || Object.keys(validators[oracleAddress]).length < validatorCount) {
        
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

        /** Manager nonce for first validator starts at 3 after registry and upkeep */
        let nonce = 3

        /** Create requested count of validators */
        const newValidators: Validator[] = []

        for (let i = 0; i < validatorCount; i++) {

            const poolAddress = ethers.utils.getContractAddress({
                from: process.env.MANAGER_ADDRESS,
                nonce
            })

            const newOperatorIds = [1, 2, 3, 4] // Todo get new group here
            const dkg = new DKG({ cliPath: process.env.CLI_PATH, messengerUrl: process.env.MESSENGER_SRV_ADDR })

            const validator = await dkg.createValidator({
                operatorIds: newOperatorIds,
                withdrawalAddress: poolAddress
            })

            newValidators.push(validator)

            nonce++
        }

        validators[oracleAddress] = newValidators

        /** Write new validators to file */
        fs.writeFileSync(`${outputPath}/validators.json`, JSON.stringify(validators, null, 4))

        /** Stop the DKG service */
        await run('npm run clean --workspace @casimir/oracle')
    }
}()