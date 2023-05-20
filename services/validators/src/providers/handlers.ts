import { ethers } from 'ethers'
import { DKG } from './dkg'
import { HandlerInput } from '../interfaces/HandlerInput'
import fs from 'fs'
import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'

export async function initiatePoolDepositHandler(input: HandlerInput) {
    const { provider, signer, manager, cliPath, messengerUrl } = input
    const newOperatorIds = [1, 2, 3, 4] // Todo get new group here
    const dkg = new DKG({ cliPath, messengerUrl })

    const validator = await dkg.createValidator({
        provider,
        manager,
        operatorIds: newOperatorIds, 
        withdrawalAddress: manager.address 
    })
    
    // Save validator for mocks
    const validators = JSON.parse(fs.readFileSync('./scripts/.out/validators.json', 'utf8'))
    validators[Date.now()] = validator
    fs.writeFileSync('./scripts/.out/validators.json', JSON.stringify(validators, null, 4))
    
    const {
        depositDataRoot,
        publicKey,
        operatorIds,
        shares,
        cluster,
        signature,
        withdrawalCredentials
    } = validator

    const initiatePoolDeposit = await (manager.connect(signer) as CasimirManager & ethers.Contract).initiatePoolDeposit(
        depositDataRoot,
        publicKey,
        operatorIds,
        shares,
        cluster,
        signature,
        withdrawalCredentials,
        ethers.utils.parseEther('0.1') // Mock fee amount estimate ~ 10 SSV
    )
    await initiatePoolDeposit.wait()
}

export async function initiatePoolReshareHandler(input: HandlerInput) {
    const { manager, signer, cliPath, messengerUrl, id } = input

    // Todo reshare event will include the operator to boot

    // Get pool to reshare
    const pool = await manager.getPool(id)
    const { publicKey, operatorIds } = pool

    // Todo old operators and new operators only different by 1 operator
    const newOperatorGroup = [1, 2, 3, 4]

    // Get operators to sign reshare
    const dkg = new DKG({ cliPath, messengerUrl })
    // const validator = await dkg.reshareValidator({ 
    //     provider,
    //     manager,
    //     publicKey, 
    //     operatorIds: newOperatorGroup, 
    //     oldOperatorIds: operatorIds, 
    //     withdrawalAddress: manager.address 
    // })


    // Submit new shares to pool

}

export async function initiatePoolExitHandler(input: HandlerInput) {
    const { manager, signer, cliPath, messengerUrl, id } = input
    
    // Get pool to exit
    const pool = await manager.getPool(id)
    const { publicKey, operatorIds } = pool

    // Get operators to sign exit
    const dkg = new DKG({ cliPath, messengerUrl })

    // Broadcast exit signature

}