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

    const managerNonce = await provider.getTransactionCount(manager.address)
    const poolAddress = ethers.utils.getContractAddress({
      from: manager.address,
      nonce: managerNonce
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
    console.log('🤖 Selected operators', selectedOperatorIds)

    const scanner = new Scanner({ 
        ethereumUrl: config.ethereumUrl,
        ssvNetworkAddress: config.ssvNetworkAddress,
        ssvNetworkViewsAddress: config.ssvNetworkViewsAddress
    })

    const cluster = await scanner.getCluster({ 
        operatorIds: selectedOperatorIds,
        ownerAddress: manager.address
    })

    const ownerNonce = await scanner.getNonce(manager.address)

    const requiredFee = await scanner.getRequiredFee(selectedOperatorIds)

    const validator = await cli.createValidator({
        poolId: input.args.poolId,
        operatorIds: selectedOperatorIds,
        ownerAddress: manager.address,
        ownerNonce,
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
    
    const uniswapFactory = new Factory({
        ethereumUrl: config.ethereumUrl,
        uniswapV3FactoryAddress: config.uniswapV3FactoryAddress
    })

    const price = await uniswapFactory.getSwapPrice({ 
        tokenIn: config.wethTokenAddress,
        tokenOut: config.ssvTokenAddress,
        uniswapFeeTier: 3000
    })

    const feeAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredFee)) * Number(price)).toPrecision(9))
    const minimumTokenAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredFee)) * 0.99).toPrecision(9))

    const initiateDeposit = await manager.initiateDeposit(
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
        cluster,
        feeAmount,
        minimumTokenAmount,
        false
    )
    await initiateDeposit.wait()
}

export async function initiateResharesHandler(input: HandlerInput) {
    if (!input.args.operatorId) throw new Error('No operator id provided')

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const signer = config.wallet.connect(provider)
    const manager = new ethers.Contract(config.managerAddress, ICasimirManagerAbi, signer) as ethers.Contract & CasimirManager
    const views = new ethers.Contract(config.viewsAddress, ICasimirViewsAbi, provider) as ethers.Contract & CasimirViews
    const registry = new ethers.Contract(config.registryAddress, ICasimirRegistryAbi, provider) as ethers.Contract & CasimirRegistry

    const poolIds = [
        ...await manager.getPendingPoolIds(),
        ...await manager.getStakedPoolIds()
    ]

    for (const poolId of poolIds) {
        const poolDetails = await views.getPoolDetails(poolId)
        const oldOperatorIds = poolDetails.operatorIds.map(id => id.toNumber())
        if (oldOperatorIds.includes(input.args.operatorId)) {
            const poolAddress = await manager.getPoolAddress(poolId)

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
        
            const newOperatorId = smallestOperators.find((operator) => !oldOperatorIds.includes(operator.id.toNumber()))?.id.toNumber()

            if (newOperatorId && poolDetails.reshares.toNumber() > 1) {
                const newOperatorIds = oldOperatorIds.map((operatorId) => {
                    if (operatorId === input.args.operatorId) return newOperatorId
                    return operatorId
                })
    
                const scanner = new Scanner({ 
                    ethereumUrl: config.ethereumUrl,
                    ssvNetworkAddress: config.ssvNetworkAddress,
                    ssvNetworkViewsAddress: config.ssvNetworkViewsAddress
                })
    
                const oldCluster = await scanner.getCluster({
                    operatorIds: oldOperatorIds,
                    ownerAddress: manager.address
                })
            
                const cluster = await scanner.getCluster({ 
                    operatorIds: newOperatorIds,
                    ownerAddress: manager.address
                })
            
                const ownerNonce = await scanner.getNonce(manager.address)
            
                const requiredFee = await scanner.getRequiredFee(newOperatorIds)
    
                const validator = await cli.reshareValidator({ 
                    publicKey: poolDetails.publicKey,
                    poolId,
                    oldOperatorIds,
                    operatorIds: newOperatorIds,
                    ownerAddress: manager.address,
                    ownerNonce,
                    withdrawalAddress: poolAddress
                })
    
                const {
                    operatorIds,
                    shares
                } = validator
    
                const uniswapFactory = new Factory({
                    ethereumUrl: config.ethereumUrl,
                    uniswapV3FactoryAddress: config.uniswapV3FactoryAddress
                })
            
                const price = await uniswapFactory.getSwapPrice({ 
                    tokenIn: config.wethTokenAddress,
                    tokenOut: config.ssvTokenAddress,
                    uniswapFeeTier: 3000
                })
            
                const feeAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredFee.sub(oldCluster.balance))) * Number(price)).toPrecision(9))
                const minimumTokenAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredFee.sub(oldCluster.balance))) * 0.99).toPrecision(9))

                const reportReshare = await manager.reportReshare(
                    poolId,
                    operatorIds,
                    oldOperatorIds,
                    newOperatorId,
                    input.args.operatorId,
                    shares,
                    cluster,
                    oldCluster,
                    feeAmount,
                    minimumTokenAmount,
                    false
                )
                await reportReshare.wait()
            } else {
                // Exit pool
            }
        }
    }
}

export async function initiateExitsHandler(input: HandlerInput) {
    if (!input.args.poolId) throw new Error('No pool id provided')

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const manager = new ethers.Contract(config.managerAddress, ICasimirManagerAbi, provider) as ethers.Contract & CasimirManager
    const views = new ethers.Contract(config.viewsAddress, ICasimirViewsAbi, provider) as ethers.Contract & CasimirViews

    // Get pool to exit
    const poolDetails = await views.getPoolDetails(input.args.poolId)

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

            const cluster = await scanner.getCluster({ 
                ownerAddress: manager.address,
                operatorIds
            })

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