import { ethers } from 'ethers'
import { HandlerInput } from '../interfaces/HandlerInput'
import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { Scanner } from '@casimir/ssv'
import { PoolStatus } from '@casimir/types'
import { Factory } from '@casimir/uniswap'
import { getConfig } from './config'
import { Keychain } from './keychain'

const config = getConfig()

export async function initiateDepositHandler(input: HandlerInput) {
    if (!input.args.poolId) throw new Error('No pool id provided')

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    
    const nonce = await provider.getTransactionCount(config.manager.address)
    const poolAddress = ethers.utils.getContractAddress({
      from: config.manager.address,
      nonce
    })

    const newOperatorIds = [1, 2, 3, 4] // Todo get new group here

    const keychain = new Keychain({ 
        strategy: config.strategy,
        cliPath: config.cliPath, 
        messengerUrl: config.messengerUrl 
    })
    const validator = await keychain.createValidator({
        poolId: input.args.poolId,
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
        ethereumUrl: config.ethereumUrl,
        ssvNetworkAddress: config.ssvNetworkAddress,
        ssvNetworkViewsAddress: config.ssvNetworkViewsAddress
    })
    const clusterDetails = await scanner.getClusterDetails({ 
        ownerAddress: config.manager.address,
        operatorIds
    })
    const { cluster, requiredBalancePerValidator } = clusterDetails

    const processed = false
    const uniswapFactory = new Factory({
        ethereumUrl: config.ethereumUrl,
        uniswapV3FactoryAddress: config.uniswapV3FactoryAddress
    })
    const price = await uniswapFactory.getSwapPrice({ 
        tokenIn: config.wethTokenAddress,
        tokenOut: config.ssvTokenAddress,
        uniswapFeeTier: 3000
    })
    const feeAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredBalancePerValidator)) * Number(price)).toPrecision(9))

    const signer = config.wallet.connect(provider)
    const initiateDeposit = await (config.manager.connect(signer) as ethers.Contract & CasimirManager).initiateDeposit(
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
    if (!input.args.poolId) throw new Error('No pool id provided')

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)

    // Todo reshare event will include the operator to boot

    // Get pool to reshare
    const poolDetails = await config.views.connect(provider).getPoolDetails(input.args.poolId)

    // Todo old operators and new operators only different by 1 operator
    const newOperatorGroup = [1, 2, 3, 4]

    // Get operators to sign reshare
    const keychain = new Keychain({ 
        strategy: config.strategy,
        cliPath: config.cliPath, 
        messengerUrl: config.messengerUrl 
    })
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
    if (!input.args.poolId) throw new Error('No pool id provided')

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    
    // Get pool to exit
    const poolDetails = await config.views.connect(provider).getPoolDetails(input.args.poolId)

    // Get operators to sign exit
    const keychain = new Keychain({ 
        strategy: config.strategy,
        cliPath: config.cliPath, 
        messengerUrl: config.messengerUrl
    })
}

export async function reportForcedExitsHandler(input: HandlerInput) {
    if (!input.args.count) throw new Error('No count provided')

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const signer = config.wallet.connect(provider)

    const stakedPoolIds = await config.manager.connect(provider).getStakedPoolIds()
    let poolIndex = 0
    let remaining = input.args.count
    while (remaining > 0) {
        const poolId = stakedPoolIds[poolIndex]
        const poolDetails = await config.views.connect(provider).getPoolDetails(poolId)
        if (poolDetails.status === PoolStatus.ACTIVE) {
            remaining--
            const reportForcedExit = await config.manager.connect(signer).reportForcedExit(
                poolIndex
            )
            await reportForcedExit.wait()
        }
        poolIndex++
    }
}

export async function reportCompletedExitsHandler(input: HandlerInput) {
    if (!input.args.count) throw new Error('No count provided')

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const signer = config.wallet.connect(provider)

    /**
     * In production, we get the completed exit order from the Beacon API (sorting by withdrawn epoch)
     * We check all validators using:
     * const stakedPublicKeys = await views.getStakedPublicKeys(startIndex, endIndex)
     * Here, we're just grabbing the next exiting pool for each completed exit
     */
    const stakedPoolIds = await config.manager.connect(provider).getStakedPoolIds()
    let remaining = input.args.count
    let poolIndex = 0
    while (remaining > 0) {
        const poolId = stakedPoolIds[poolIndex]
        const poolDetails = await config.views.connect(provider).getPoolDetails(poolId)
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
                ethereumUrl: config.ethereumUrl,
                ssvNetworkAddress: config.ssvNetworkAddress,
                ssvNetworkViewsAddress: config.ssvNetworkViewsAddress
            })
            const clusterDetails = await scanner.getClusterDetails({ 
                ownerAddress: config.manager.address,
                operatorIds
            })
            const { cluster } = clusterDetails
            const reportCompletedExit = await config.manager.connect(signer).reportCompletedExit(
                poolIndex,
                blamePercents,
                cluster
            )
            await reportCompletedExit.wait()
        }
        poolIndex++
    }
}