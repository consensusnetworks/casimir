import { ethers } from 'ethers'
import { Dkg } from './dkg'
import { HandlerInput } from '../interfaces/HandlerInput'
import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { Scanner } from '@casimir/ssv'
import { PoolStatus } from '@casimir/types'
import { Factory } from '@casimir/uniswap'
import { getConfig } from './config'

export async function initiateDepositHandler(input: HandlerInput) {
    const { 
        ethereumUrl,
        provider,
        signer,
        manager,
        views,
        linkTokenAddress,
        ssvNetworkAddress,
        ssvNetworkViewsAddress,
        ssvTokenAddress,
        uniswapV3FactoryAddress,
        wethTokenAddress,
        cliPath,
        messengerUrl
    } = getConfig()

    const { poolId } = input as { poolId: number }

    const nonce = await provider.getTransactionCount(manager.address)

    const poolAddress = ethers.utils.getContractAddress({
      from: manager.address,
      nonce
    })

    const newOperatorIds = [1, 2, 3, 4] // Todo get new group here
    const dkg = new Dkg({ cliPath, messengerUrl })

    const validator = await dkg.createValidator({
        poolId,
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

    const scanner = new Scanner({ 
        ethereumUrl,
        ssvNetworkAddress,
        ssvNetworkViewsAddress
    })
    const clusterDetails = await scanner.getClusterDetails({ 
        ownerAddress: manager.address,
        operatorIds
    })
    const { cluster, requiredBalancePerValidator } = clusterDetails

    const processed = false
    const uniswapFactory = new Factory({
        ethereumUrl,
        uniswapV3FactoryAddress
    })
    const price = await uniswapFactory.getSwapPrice({ 
        tokenIn: wethTokenAddress,
        tokenOut: ssvTokenAddress,
        uniswapFeeTier: 3000
    })
    const feeAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredBalancePerValidator)) * Number(price)).toPrecision(9))

    const initiateDeposit = await (manager.connect(signer) as ethers.Contract & CasimirManager).initiateDeposit(
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
        linkTokenAddress,
        ssvTokenAddress,
        wethTokenAddress,
        cliPath,
        messengerUrl
    } = getConfig()

    const { poolId } = input as { poolId: number }

    // Todo reshare event will include the operator to boot

    // Get pool to reshare
    const poolDetails = await views.getPoolDetails(poolId)

    // Todo old operators and new operators only different by 1 operator
    const newOperatorGroup = [1, 2, 3, 4]

    // Get operators to sign reshare
    const dkg = new Dkg({ cliPath, messengerUrl })
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
        linkTokenAddress,
        ssvTokenAddress,
        wethTokenAddress,
        cliPath,
        messengerUrl
    } = getConfig()

    const { poolId } = input as { poolId: number }

    // Get pool to exit
    const poolDetails = await views.getPoolDetails(poolId)
    // Get operators to sign exit
    const dkg = new Dkg({ cliPath, messengerUrl })
}

export async function reportForcedExitsHandler(input: HandlerInput) {
    const { 
        provider,
        signer,
        manager,
        views,
        linkTokenAddress,
        ssvTokenAddress,
        wethTokenAddress,
        cliPath,
        messengerUrl
    } = getConfig()

    const { count } = input as { count: number }

    const stakedPoolIds = await manager.getStakedPoolIds()
    let poolIndex = 0
    let remaining = count
    while (remaining > 0) {
        const poolId = stakedPoolIds[poolIndex]
        const poolDetails = await views.getPoolDetails(poolId)
        if (poolDetails.status === PoolStatus.ACTIVE) {
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
        ethereumUrl,
        signer,
        manager,
        views,
        linkTokenAddress,
        ssvNetworkAddress,
        ssvNetworkViewsAddress,
        ssvTokenAddress,
        wethTokenAddress,
        cliPath,
        messengerUrl
    } = getConfig()

    const { count } = input as { count: number }

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
        if (poolDetails.status === PoolStatus.EXITING_FORCED || poolDetails.status === PoolStatus.EXITING_REQUESTED) {
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
            const scanner = new Scanner({
                ethereumUrl,
                ssvNetworkAddress,
                ssvNetworkViewsAddress
            })
            const clusterDetails = await scanner.getClusterDetails({ 
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