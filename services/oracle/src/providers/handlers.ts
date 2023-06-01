import { ethers } from 'ethers'
import { DKG } from './dkg'
import { HandlerInput } from '../interfaces/HandlerInput'
import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { getClusterDetails } from '@casimir/ssv'

export async function initiatePoolDepositHandler(input: HandlerInput) {
    const { 
        provider,
        signer,
        manager,
        networkAddress,
        networkViewsAddress,
        cliPath,
        messengerUrl,
        value
    } = input

    const poolId = value
    const newOperatorIds = [1, 2, 3, 4] // Todo get new group here
    const dkg = new DKG({ cliPath, messengerUrl })

    const validator = await dkg.createValidator({
        provider,
        manager,
        operatorIds: newOperatorIds, 
        withdrawalAddress: manager.address 
    })
    
    const {
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares
    } = validator

    const clusterDetails = await getClusterDetails({ 
        provider,
        networkAddress,
        networkViewsAddress,
        operatorIds,
        withdrawalAddress: manager.address
    })

    const { cluster, requiredFees } = clusterDetails

    const initiatePoolDeposit = await (manager.connect(signer) as CasimirManager & ethers.Contract).initiatePoolDeposit(
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
        cluster,
        requiredFees // Mock fee amount estimate ~ 10 SSV
    )
    await initiatePoolDeposit.wait()
}

export async function initiatePoolReshareHandler(input: HandlerInput) {
    const {         
        provider,
        signer,
        manager,
        networkAddress,
        networkViewsAddress,
        cliPath,
        messengerUrl,
        value
    } = input

    const poolId = value

    // Todo reshare event will include the operator to boot

    // Get pool to reshare
    const pool = await manager.getPool(poolId)
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
    const {
        provider,
        signer,
        manager,
        networkAddress,
        networkViewsAddress,
        cliPath,
        messengerUrl,
        value 
    } = input

    const poolId = value

    // Get pool to exit
    const pool = await manager.getPool(poolId)
    const { publicKey, operatorIds } = pool

    // Get operators to sign exit
    const dkg = new DKG({ cliPath, messengerUrl })

    // Broadcast exit signature

}