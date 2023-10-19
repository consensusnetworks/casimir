import fs from 'fs'
import { ethers } from 'ethers'
import { run } from '@casimir/shell'
import { Dkg } from '../src/providers/dkg'
import { MOCK_VALIDATORS/*, MOCK_RESHARES*/ } from '@casimir/env'
import { Validator/*, Reshare*/ } from '@casimir/types'

/**
 * Generate validator keys for ethereum testing
 */
void async function () {
    const outputPath = '../../common/env/src/mock'

    process.env.CLI_PATH = process.env.CLI_PATH || './lib/dkg/bin/ssv-dkg'
    process.env.CONFIG_PATH = process.env.CONFIG_PATH || './config/example.dkg.initiator.yaml'

    process.env.BIP39_SEED = process.env.BIP39_SEED || 'inflict ball claim confirm cereal cost note dad mix donate traffic patient'
    
    if (!process.env.FACTORY_ADDRESS) throw new Error('No factory address provided')

    const preregisteredOperatorIds = process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [208, 209, 210, 211, 212, 213, 214, 215]
    if (preregisteredOperatorIds.length < 8) throw new Error('Not enough operator ids provided')

    const accountPath = 'm/44\'/60\'/0\'/0/1'
    const wallet = ethers.Wallet.fromMnemonic(process.env.BIP39_SEED, accountPath)

    const validatorCount = 4
    if (!MOCK_VALIDATORS[wallet.address] || Object.keys(MOCK_VALIDATORS[wallet.address]).length < validatorCount) {
        await run('GOWORK=off make -C lib/dkg build') 

        const managerAddress = ethers.utils.getContractAddress({
            from: process.env.FACTORY_ADDRESS,
            nonce: 1
        })
        let managerNonce = 3
        let ownerNonce = 0

        const newValidators: Validator[] = []
        // const newReshares: Reshare[] = []

        for (let i = 0; i < validatorCount; i++) {
            const poolId = i + 1
            console.log('🤖 Creating deposit for', poolId)

            const poolAddress = ethers.utils.getContractAddress({
                from: managerAddress,
                nonce: managerNonce
            })

            const selectedOperatorIds = preregisteredOperatorIds.slice(0, 4)

            const dkg = new Dkg({
                cliPath: process.env.CLI_PATH,
                configPath: process.env.CONFIG_PATH,
            })

            const validator = await dkg.init({
                poolId,
                operatorIds: selectedOperatorIds,
                ownerAddress: managerAddress,
                ownerNonce,
                withdrawalAddress: poolAddress
            })

            newValidators.push(validator)

            // for (let j = 0; j < 2; j++) {
            //     const oldOperatorIds = selectedOperatorIds.slice(1)
            //     const reshareOperatorIds = preregisteredOperatorIds.slice(0, 3).concat(preregisteredOperatorIds[4])

            //     const reshare = await dkg.reshare({
            //         oldOperatorIds,
            //         operatorIds: reshareOperatorIds,
            //         ownerAddress: managerAddress,
            //         ownerNonce,
            //         poolId,
            //         publicKey: validator.publicKey,
            //         withdrawalAddress: poolAddress
            //     })
            //     newReshares.push(reshare)
            // }
            // reshareStore[poolId] = newReshares

            managerNonce++
            ownerNonce++
        }

        MOCK_VALIDATORS[wallet.address] = newValidators

        fs.writeFileSync(`${outputPath}/validators.json`, JSON.stringify(MOCK_VALIDATORS))
        // fs.writeFileSync(`${outputPath}/reshares.json`, JSON.stringify(MOCK_RESHARES))
    }
}()