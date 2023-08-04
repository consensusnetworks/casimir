import { ethers } from 'ethers'
import { HandlerInput } from '../interfaces/HandlerInput'
import { CasimirManager, CasimirRegistry, CasimirViews } from '@casimir/ethereum/build/@types'
import ICasimirManagerAbi from '@casimir/ethereum/build/abi/ICasimirManager.json'
import ICasimirViewsAbi from '@casimir/ethereum/build/abi/ICasimirViews.json'
import ICasimirRegistryAbi from '@casimir/ethereum/build/abi/ICasimirRegistry.json'
import { Scanner } from '@casimir/ssv'
import { PoolStatus } from '@casimir/types'
import { Factory } from '@casimir/uniswap'
import { getConfig } from './config'
import { Dkg } from './dkg'

const config = getConfig()
const cli = new Dkg({
    cliPath: config.cliPath,
    messengerUrl: config.messengerUrl
})

export async function initiateDepositHandler(input: HandlerInput) {
    if (!input.args.poolId) throw new Error('No pool id provided')

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const signer = config.wallet.connect(provider)
    const manager = new ethers.Contract(config.managerAddress, ICasimirManagerAbi, signer) as ethers.Contract & CasimirManager
    const views = new ethers.Contract(config.viewsAddress, ICasimirViewsAbi, provider) as ethers.Contract & CasimirViews
    const registry = new ethers.Contract(config.registryAddress, ICasimirRegistryAbi, provider) as ethers.Contract & CasimirRegistry

    const nonce = await provider.getTransactionCount(manager.address)
    const poolAddress = ethers.utils.getContractAddress({
      from: manager.address,
      nonce
    })

    const operatorCount = (await registry.getOperatorIds()).length
    const operators = await views.getOperators(0, operatorCount)

    const eligibleOperators = operators.filter((operator) => {
        const availableCollateral = parseInt(ethers.utils.formatEther(operator.collateral)) - parseInt(operator.poolCount.toString())
        return operator.active && !operator.resharing && availableCollateral > 0
    })

    const smallestOperators = eligibleOperators.sort((a, b) => {
        const aPoolCount = parseInt(a.poolCount.toString())
        const bPoolCount = parseInt(b.poolCount.toString())
        if (aPoolCount < bPoolCount) return -1
        if (aPoolCount > bPoolCount) return 1
        return 0
    })

    const selectedOperatorIds = smallestOperators.slice(0, 4).map((operator) => operator.id.toNumber())

    const validator = await cli.createValidator({
        poolId: input.args.poolId,
        operatorIds: selectedOperatorIds, 
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
        ownerAddress: manager.address,
        operatorIds
    })
    
    const { cluster, requiredBalancePerValidator } = clusterDetails

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

    const initiateDeposit = await manager.initiateDeposit(
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
        cluster,
        feeAmount,
        false
    )
    await initiateDeposit.wait()
}

export async function initiateResharesHandler(input: HandlerInput) {
    if (!input.args.poolId) throw new Error('No pool id provided')

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const signer = config.wallet.connect(provider)
    const manager = new ethers.Contract(config.managerAddress, ICasimirManagerAbi, signer) as ethers.Contract & CasimirManager
    const views = new ethers.Contract(config.viewsAddress, ICasimirViewsAbi, provider) as ethers.Contract & CasimirViews

    // Todo reshare event will include the operator to boot

    // Get pool to reshare
    const poolDetails = await views.connect(provider).getPoolDetails(input.args.poolId)

    // Todo old operators and new operators only different by 1 operator
    const newOperatorGroup = [1, 2, 3, 4]

    // Get operators to sign reshare
    // const validator = await cli.reshareValidator({ 
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
    const manager = new ethers.Contract(config.managerAddress, ICasimirManagerAbi, provider) as ethers.Contract & CasimirManager
    const views = new ethers.Contract(config.viewsAddress, ICasimirViewsAbi, provider) as ethers.Contract & CasimirViews

    // Get pool to exit
    const poolDetails = await views.connect(provider).getPoolDetails(input.args.poolId)

    // Get operators to sign exit
}

export async function reportForcedExitsHandler(input: HandlerInput) {
    if (!input.args.count) throw new Error('No count provided')

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const signer = config.wallet.connect(provider)
    const manager = new ethers.Contract(config.managerAddress, ICasimirManagerAbi, signer) as ethers.Contract & CasimirManager
    const views = new ethers.Contract(config.viewsAddress, ICasimirViewsAbi, provider) as ethers.Contract & CasimirViews

    const stakedPoolIds = await manager.getStakedPoolIds()
    let poolIndex = 0
    let remaining = input.args.count
    while (remaining > 0) {
        const poolId = stakedPoolIds[poolIndex]
        const poolDetails = await views.getPoolDetails(poolId)
        if (poolDetails.status === PoolStatus.ACTIVE) {
            remaining--
            const reportForcedExit = await manager.reportForcedExit(
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
    const manager = new ethers.Contract(config.managerAddress, ICasimirManagerAbi, signer) as ethers.Contract & CasimirManager
    const views = new ethers.Contract(config.viewsAddress, ICasimirViewsAbi, provider) as ethers.Contract & CasimirViews

    /**
     * In production, we get the completed exit order from the Beacon API (sorting by withdrawn epoch)
     * We check all validators using:
     * const stakedPublicKeys = await views.getStakedPublicKeys(startIndex, endIndex)
     * Here, we're just grabbing the next exiting pool for each completed exit
     */
    const stakedPoolIds = await manager.getStakedPoolIds()
    let remaining = input.args.count
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
                ethereumUrl: config.ethereumUrl,
                ssvNetworkAddress: config.ssvNetworkAddress,
                ssvNetworkViewsAddress: config.ssvNetworkViewsAddress
            })
            const clusterDetails = await scanner.getClusterDetails({ 
                ownerAddress: manager.address,
                operatorIds
            })
            const { cluster } = clusterDetails
            const reportCompletedExit = await manager.reportCompletedExit(
                poolIndex,
                blamePercents,
                cluster
            )
            await reportCompletedExit.wait()
        }
        poolIndex++
    }
}