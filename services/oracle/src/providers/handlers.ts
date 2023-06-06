import { ethers } from 'ethers'
import { DKG } from './dkg'
import { HandlerInput } from '../interfaces/HandlerInput'
import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { getClusterDetails } from '@casimir/ssv'

export async function initiateDepositHandler(input: HandlerInput) {
    const { 
        provider,
        signer,
        manager,
        cliPath,
        messengerUrl
    } = input

    const nonce = await provider.getTransactionCount(manager.address)
    const poolAddress = ethers.utils.getContractAddress({
      from: manager.address,
      nonce
    })

    const newOperatorIds = [1, 2, 3, 4] // Todo get new group here
    const dkg = new DKG({ cliPath, messengerUrl })

    const validator = await dkg.createValidator({
        provider,
        manager,
        operatorIds: newOperatorIds, 
        withdrawalAddress: poolAddress
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
        ownerAddress: manager.address,
        operatorIds
    })

    const { cluster, requiredBalancePerValidator } = clusterDetails

    const initiateDeposit = await (manager.connect(signer) as CasimirManager & ethers.Contract).initiateDeposit(
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
        cluster,
        requiredBalancePerValidator,
        false
    )
    await initiateDeposit.wait()
}

export async function initiatePoolReshareHandler(input: HandlerInput) {
    const {         
        provider,
        signer,
        manager,
        cliPath,
        messengerUrl,
        args
    } = input

    const { poolId } = args

    // Todo reshare event will include the operator to boot

    // Get pool to reshare
    const poolDetails = await manager.getPoolDetails(poolId)

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
        cliPath,
        messengerUrl,
        args 
    } = input

    const { poolId } = args

    // Get pool to exit
    const poolDetails = await manager.getPoolDetails(poolId)
    // Get operators to sign exit
    const dkg = new DKG({ cliPath, messengerUrl })

    // Broadcast exit signature

}

export async function reportCompletedExitsHandler(input: HandlerInput) {
    const {
        provider,
        signer,
        manager,
        args 
    } = input

    const { count } = args

    // In production, we get the withdrawn exit order from the Beacon API (sorting by withdrawal epoch)
    // Here, we're just reporting them in the order they were exited
    let remaining = count
    let poolIndex = 0
    const stakedPoolIds = await manager.getStakedPoolIds()
    while (remaining > 0) {
        const poolId = stakedPoolIds[poolIndex]
        const poolDetails = await manager.getPoolDetails(poolId)
        if (poolDetails.status === 2 || poolDetails.status === 3) {
            remaining--
            const operatorIds = poolDetails.operatorIds.map((operatorId) => operatorId.toNumber())
            const blamePercents = [0, 0, 0, 0]
            const clusterDetails = await getClusterDetails({ 
                provider: provider,
                ownerAddress: manager.address,
                operatorIds
            })
            const { cluster } = clusterDetails
            const reportCompletedExit = await manager.connect(signer).reportCompletedExit(
                poolIndex,
                blamePercents,
                cluster
            )
            await reportCompletedExit.wait()
        }
        poolIndex++
    }
}