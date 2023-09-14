import fs from 'fs'
import { ethers } from 'ethers'
import { fetchRetry } from '@casimir/fetch'
import { run } from '@casimir/shell'
import { Validator } from '@casimir/types'
import { Dkg } from '../src/providers/dkg'
import { validatorStore } from '@casimir/data'

/**
 * Generate validator keys for ethereum testing
 */
void async function () {
    const outputPath = '../../common/data/src/mock'
    const resourceDir = 'scripts/resources'

    process.env.CLI_PATH = process.env.CLI_PATH || `./${resourceDir}/rockx-dkg-cli/build/bin/rockx-dkg-cli`
    process.env.MESSENGER_URL = process.env.MESSENGER_URL || 'https://nodes.casimir.co/eth/goerli/dkg/messenger'
    process.env.MESSENGER_SRV_ADDR = process.env.MESSENGER_URL
    process.env.USE_HARDCODED_OPERATORS = 'false'

    process.env.BIP39_SEED = process.env.BIP39_SEED || 'inflict ball claim confirm cereal cost note dad mix donate traffic patient'
    if (!process.env.MANAGER_ADDRESS) throw new Error('No manager address set')
    if (!process.env.VIEWS_ADDRESS) throw new Error('No views address set')
    process.env.LINK_TOKEN_ADDRESS = '0x326C977E6efc84E512bB9C30f76E30c160eD06FB'
    process.env.SSV_NETWORK_ADDRESS = '0xC3CD9A0aE89Fff83b71b58b6512D43F8a41f363D'
    process.env.SSV_VIEWS_ADDRESS = '0xAE2C84c48272F5a1746150ef333D5E5B51F68763'
    process.env.SSV_TOKEN_ADDRESS = '0x3a9f01091C446bdE031E39ea8354647AFef091E7'
    process.env.UNISWAP_V3_FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
    process.env.WETH_TOKEN_ADDRESS = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'

    const preregisteredOperatorIds = process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [156, 157, 158, 159]
    if (preregisteredOperatorIds.length < 4) throw new Error('Not enough operator ids provided')

    const accountPath = 'm/44\'/60\'/0\'/0/1'
    const wallet = ethers.Wallet.fromMnemonic(process.env.BIP39_SEED, accountPath)

    const validatorCount = 4
    if (!validatorStore[wallet.address] || Object.keys(validatorStore[wallet.address]).length < validatorCount) {
        const dkg = await run(`which ${process.env.CLI_PATH}`) as string
        if (!dkg || dkg.includes('not found')) {
            await run(`GOWORK=off make -C ${resourceDir}/rockx-dkg-cli build`)
        }
        const ping = await fetchRetry(`${process.env.MESSENGER_URL}/ping`)
        const { message } = await ping.json()
        if (message !== 'pong') throw new Error('Dkg service is not running')

        let managerNonce = 3
        let ownerNonce = 0

        const newValidators: Validator[] = []

        for (let i = 0; i < validatorCount; i++) {

            const poolAddress = ethers.utils.getContractAddress({
                from: process.env.MANAGER_ADDRESS,
                nonce: managerNonce
            })

            const selectedOperatorIds = preregisteredOperatorIds.slice(0, 4)

            const cli = new Dkg({
                cliPath: process.env.CLI_PATH,
                messengerUrl: process.env.MESSENGER_URL
            })

            const validator = await cli.createValidator({
                poolId: i + 1,
                operatorIds: selectedOperatorIds,
                ownerAddress: process.env.MANAGER_ADDRESS,
                ownerNonce,
                withdrawalAddress: poolAddress
            })

            newValidators.push(validator)

            managerNonce++
            ownerNonce++
        }

        validatorStore[wallet.address] = newValidators

        fs.writeFileSync(`${outputPath}/validator.store.json`, JSON.stringify(validatorStore, null, 4))
    }
}()