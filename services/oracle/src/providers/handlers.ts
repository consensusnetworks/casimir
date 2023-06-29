import { ethers } from 'ethers'
import { DKG } from './dkg'
import { HandlerInput } from '../interfaces/HandlerInput'
import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { getClusterDetails } from '@casimir/ssv'
import { getPrice } from '@casimir/uniswap'

export async function initiateDepositHandler(input: HandlerInput) {
    const { 
        provider,
        signer,
        manager,
        ssvTokenAddress,
        wethTokenAddress,
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

    const processed = false
    const price = await getPrice({ 
        provider,
        tokenIn: wethTokenAddress,
        tokenOut: ssvTokenAddress,
        uniswapFeeTier: 3000
    })
    const feeAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredBalancePerValidator)) * Number(price)).toPrecision(9))

    const initiateDeposit = await (manager.connect(signer) as CasimirManager & ethers.Contract).initiateDeposit(
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
        cluster,
        feeAmount,
        processed
    )
    await initiateDeposit.wait()
}

export async function initiateResharesHandler(input: HandlerInput) {
    const {         
        provider,
        signer,
        manager,
        views,
        cliPath,
        messengerUrl,
        args
    } = input

    const { poolId } = args

    // Todo reshare event will include the operator to boot

    // Get pool to reshare
    const poolDetails = await views.getPoolDetails(poolId)

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

export async function initiateExitsHandler(input: HandlerInput) {
    const {
        provider,
        signer,
        manager,
        views,
        cliPath,
        messengerUrl,
        args 
    } = input

    const { poolId } = args

    // Get pool to exit
    const poolDetails = await views.getPoolDetails(poolId)
    // Get operators to sign exit
    const dkg = new DKG({ cliPath, messengerUrl })
}

export async function reportForcedExitsHandler(input: HandlerInput) {
    const {
        provider,
        signer,
        manager,
        views,
        args 
    } = input

    const { count } = args

    const stakedPoolIds = await manager.getStakedPoolIds()
    let poolIndex = 0
    let remaining = count
    while (remaining > 0) {
        const poolId = stakedPoolIds[poolIndex]
        const poolDetails = await views.getPoolDetails(poolId)
        if (poolDetails.status === 1) {
            remaining--
            const reportForcedExit = await manager.connect(signer).reportForcedExit(
                poolIndex
            )
            await reportForcedExit.wait()
        }
        poolIndex++
    }
}

export async function reportCompletedExitsHandler(input: HandlerInput) {
    const {
        provider,
        signer,
        manager,
        views,
        args 
    } = input

    const { count } = args

    /**
     * In production, we get the completed exit order from the Beacon API (sorting by withdrawn epoch)
     * We check all validators using:
     * const stakedPublicKeys = await views.getStakedPublicKeys(startIndex, endIndex)
     * Here, we're just grabbing the next exiting pool for each completed exit
     */
    const stakedPoolIds = await manager.getStakedPoolIds()
    let remaining = count
    let poolIndex = 0
    while (remaining > 0) {
        const poolId = stakedPoolIds[poolIndex]
        const poolDetails = await views.getPoolDetails(poolId)
        if (poolDetails.status === 2 || poolDetails.status === 3) {
            remaining--
            
            /**
             * In production, we use the SSV performance data to determine blame
             * We check all validators using:
             * const stakedPublicKeys = await views.getStakedPublicKeys(startIndex, endIndex)
             * Here, we're just hardcoding blame to the first operator if less than 32 ETH
             */
            const operatorIds = poolDetails.operatorIds.map((operatorId) => operatorId.toNumber())
            let blamePercents = [0, 0, 0, 0]
            if (poolDetails.balance.lt(ethers.utils.parseEther('32'))) {
                blamePercents = [100, 0, 0, 0]
            }
            const clusterDetails = await getClusterDetails({ 
                provider,
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