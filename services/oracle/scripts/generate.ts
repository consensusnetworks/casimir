import fs from 'fs'
import { ethers } from 'ethers'
import { run } from '@casimir/shell'
import { /*Reshare, */Validator } from '@casimir/types'
import { Dkg } from '../src/providers/dkg'
import { /*reshareStore, */validatorStore } from '@casimir/data'

/**
 * Generate validator keys for ethereum testing
 */
void async function () {
    const outputPath = '../../common/data/src/mock'

    process.env.CLI_PATH = process.env.CLI_PATH || './lib/dkg/bin/dkgcli'

    process.env.BIP39_SEED = process.env.BIP39_SEED || 'inflict ball claim confirm cereal cost note dad mix donate traffic patient'
    if (!process.env.MANAGER_ADDRESS) throw new Error('No manager address set')
    if (!process.env.VIEWS_ADDRESS) throw new Error('No views address set')

    const preregisteredOperatorIds = process.env.PREREGISTERED_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [208, 209, 210, 211, 212, 213, 214, 215]
    if (preregisteredOperatorIds.length < 8) throw new Error('Not enough operator ids provided')

    const accountPath = 'm/44\'/60\'/0\'/0/1'
    const wallet = ethers.Wallet.fromMnemonic(process.env.BIP39_SEED, accountPath)

    const validatorCount = 4
    if (!validatorStore[wallet.address] || Object.keys(validatorStore[wallet.address]).length < validatorCount) {
        const dkg = await run(`which ${process.env.CLI_PATH}`) as string
        if (!dkg || dkg.includes('not found')) {
            await run('GOWORK=off make -C lib/dkg build') 
        }

        let managerNonce = 3
        let ownerNonce = 0

        const newValidators: Validator[] = []
        // const newReshares: Reshare[] = []

        for (let i = 0; i < validatorCount; i++) {
            const poolId = i + 1

            const poolAddress = ethers.utils.getContractAddress({
                from: process.env.MANAGER_ADDRESS,
                nonce: managerNonce
            })

            const selectedOperatorIds = preregisteredOperatorIds.slice(0, 4)

            const cli = new Dkg(process.env.CLI_PATH)

            const validator = await cli.createValidator({
                poolId,
                operatorIds: selectedOperatorIds,
                ownerAddress: process.env.MANAGER_ADDRESS,
                ownerNonce,
                withdrawalAddress: poolAddress
            })

            console.log('SHARES LENGTH', validator.shares.length)

            newValidators.push(validator)

            // for (let j = 0; j < 2; j++) {
            //     const oldOperatorIds = selectedOperatorIds.slice(1)
            //     const reshareOperatorIds = preregisteredOperatorIds.slice(0, 3).concat(preregisteredOperatorIds[4])

            //     const reshare = await cli.reshareValidator({
            //         oldOperatorIds,
            //         operatorIds: reshareOperatorIds,
            //         ownerAddress: process.env.MANAGER_ADDRESS,
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

        validatorStore[wallet.address] = newValidators

        fs.writeFileSync(`${outputPath}/validator.store.json`, JSON.stringify(validatorStore, null, 4))
        // fs.writeFileSync(`${outputPath}/reshare.store.json`, JSON.stringify(reshareStore, null, 4))
    }
}()