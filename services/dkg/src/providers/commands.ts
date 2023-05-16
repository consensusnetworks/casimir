import { ethers } from 'ethers'
import { DKG } from './dkg'
import { CommandOptions } from '../interfaces/CommandOptions'

export async function initiatePoolDepositCommand(options: CommandOptions) {
    const { manager, signer, cliPath, messengerUrl } = options
    const newOperatorGroup = [1, 2, 3, 4] // Todo get new group here
    const ssv = new DKG({ cliPath, messengerUrl })
    const validator = await ssv.createValidator({ operatorIds: newOperatorGroup, withdrawalAddress: manager.address })
    const {
        depositDataRoot,
        publicKey,
        operatorIds,
        sharesEncrypted,
        sharesPublicKeys,
        signature,
        withdrawalCredentials
    } = validator
    const initiatePoolDeposit = await manager.connect(signer).initiatePoolDeposit(
        depositDataRoot,
        publicKey,
        operatorIds,
        sharesEncrypted,
        sharesPublicKeys,
        signature,
        withdrawalCredentials,
        ethers.utils.parseEther('0.1') // Mock fee amount estimate ~ 10 SSV
    )
    await initiatePoolDeposit.wait()
}

export async function initiatePoolReshareCommand(options: CommandOptions) {
    const { manager, signer, cliPath, messengerUrl, id } = options

    // Todo reshare event will include the operator to boot

    // Get pool to reshare
    const pool = await manager.getPool(id)
    const { publicKey, operatorIds } = pool

    // Todo old operators and new operators only different by 1 operator
    const newOperatorGroup = [1, 2, 3, 4]

    // Get operators to sign reshare
    const ssv = new DKG({ cliPath, messengerUrl })
    const validator = await ssv.reshareValidator({ publicKey, operatorIds: newOperatorGroup, oldOperatorIds: operatorIds, withdrawalAddress: manager.address })


    // Submit new shares to pool

}

export async function initiatePoolExitCommand(options: CommandOptions) {
    const { manager, signer, cliPath, messengerUrl, id } = options
    
    // Get pool to exit
    const pool = await manager.getPool(id)
    const { publicKey, operatorIds } = pool

    // Get operators to sign exit
    const ssv = new DKG({ cliPath, messengerUrl })

    // Broadcast exit signature

}