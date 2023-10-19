import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { CasimirManager, CasimirViews } from '../build/@types'
import { PoolStatus, Reshare, Validator } from '@casimir/types'
import { Scanner } from '@casimir/ssv'
import { Factory } from '@casimir/uniswap'
import { MOCK_VALIDATORS, MOCK_RESHARES } from '@casimir/env'

const linkTokenAddress = process.env.LINK_TOKEN_ADDRESS as string
if (!linkTokenAddress) throw new Error('No link token address provided')
const ssvNetworkAddress = process.env.SSV_NETWORK_ADDRESS as string
if (!ssvNetworkAddress) throw new Error('No ssv network address provided')
const ssvViewsAddress = process.env.SSV_VIEWS_ADDRESS as string
if (!ssvViewsAddress) throw new Error('No ssv views address provided')
const ssvTokenAddress = process.env.SSV_TOKEN_ADDRESS as string
if (!ssvTokenAddress) throw new Error('No ssv token address provided')
const uniswapV3FactoryAddress = process.env.SWAP_FACTORY_ADDRESS as string
if (!uniswapV3FactoryAddress) throw new Error('No uniswap v3 factory address provided')
const wethTokenAddress = process.env.WETH_TOKEN_ADDRESS as string
if (!wethTokenAddress) throw new Error('No weth token address provided')

export async function initiatePoolHandler({ manager, signer }: { manager: CasimirManager, signer: SignerWithAddress }) {
    const mockValidators: Validator[] = MOCK_VALIDATORS[signer.address as keyof typeof MOCK_VALIDATORS]
    const nonce = await ethers.provider.getTransactionCount(manager.address)
    const poolAddress = ethers.utils.getContractAddress({
        from: manager.address,
        nonce
    })
    const poolWithdrawalCredentials = '0x' + '01' + '0'.repeat(22) + poolAddress.split('0x')[1]
    const validator = mockValidators.find((validator) => {
        return validator.withdrawalCredentials.toLowerCase() === poolWithdrawalCredentials.toLowerCase()
    })
    if (!validator) throw new Error(`No validator found for withdrawal credentials ${poolWithdrawalCredentials}`)
    
    const {
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares,
    } = validator

    const initiatePool = await manager.connect(signer).initiatePool(
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares
    )
    await initiatePool.wait()
}

export async function activatePoolHandler({ manager, views, signer }: { manager: CasimirManager, views: CasimirViews, signer: SignerWithAddress }) {
    const pendingPoolIndex = 0
    const [pendingPoolId] = await manager.getPendingPoolIds()
    const poolConfig = await views.getPoolConfig(pendingPoolId)
    const operatorIds = poolConfig.operatorIds.map((operatorId) => operatorId.toNumber())

    const scanner = new Scanner({
        provider: ethers.provider,
        ssvNetworkAddress,
        ssvViewsAddress
    })

    const cluster = await scanner.getCluster({ 
        ownerAddress: manager.address,
        operatorIds
    })

    const requiredFee = await scanner.getRequiredFee(operatorIds)

    const uniswapFactory = new Factory({
        provider: ethers.provider,
        uniswapV3FactoryAddress
    })

    const price = await uniswapFactory.getSwapPrice({ 
        tokenIn: wethTokenAddress,
        tokenOut: ssvTokenAddress,
        uniswapFeeTier: 3000
    })

    const feeAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredFee)) * price).toPrecision(9))
    const minTokenAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredFee)) * 0.99).toPrecision(9))

    const activatePool = await manager.connect(signer).activatePool(
        pendingPoolIndex,
        cluster,
        feeAmount,
        minTokenAmount,
        false
    )
    await activatePool.wait()
}

export async function resharePoolHandler({ manager, views, signer, args }: { manager: CasimirManager, views: CasimirViews, signer: SignerWithAddress, args: Record<string, any> }) {
    const { operatorId } = args
    if (!operatorId) throw new Error('No operator id provided')
    
    const poolIds = [
        ...await manager.getPendingPoolIds(),
        ...await manager.getStakedPoolIds()
    ]

    for (const poolId of poolIds) {
        const poolConfig = await views.getPoolConfig(poolId)
        const oldOperatorIds = poolConfig.operatorIds.map(id => id.toNumber())
        if (oldOperatorIds.includes(operatorId)) {
            const mockReshares: Reshare[] = MOCK_RESHARES[poolId as keyof typeof MOCK_RESHARES]
            const poolReshareCount = poolConfig.reshares.toNumber()
            if (mockReshares.length && poolReshareCount < 2) {
                const reshare = mockReshares.find((reshare) => {
                    return JSON.stringify(reshare.oldOperatorIds) === JSON.stringify(oldOperatorIds)
                })
                if (!reshare) throw new Error(`No reshare found for pool ${poolId} with old operator ids ${oldOperatorIds}`)

                const newOperatorId = reshare.operatorIds.find((id) => !oldOperatorIds.includes(id)) as number

                const scanner = new Scanner({ 
                    provider: ethers.provider,
                    ssvNetworkAddress,
                    ssvViewsAddress
                })
    
                const oldCluster = await scanner.getCluster({
                    operatorIds: oldOperatorIds,
                    ownerAddress: manager.address
                })
            
                const cluster = await scanner.getCluster({ 
                    operatorIds: reshare.operatorIds,
                    ownerAddress: manager.address
                })
                        
                const requiredFee = await scanner.getRequiredFee(reshare.operatorIds)
    
                const uniswapFactory = new Factory({
                    provider: ethers.provider,
                    uniswapV3FactoryAddress
                })
            
                const price = await uniswapFactory.getSwapPrice({ 
                    tokenIn: wethTokenAddress,
                    tokenOut: ssvTokenAddress,
                    uniswapFeeTier: 3000
                })
            
                const feeAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredFee.sub(oldCluster.balance))) * Number(price)).toPrecision(9))
                const minTokenAmount = ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredFee.sub(oldCluster.balance))) * 0.99).toPrecision(9))

                const reportReshare = await manager.connect(signer).resharePool(
                    poolId,
                    reshare.operatorIds,
                    newOperatorId,
                    operatorId,
                    reshare.shares,
                    cluster,
                    oldCluster,
                    feeAmount,
                    minTokenAmount,
                    false
                )
                await reportReshare.wait()
            } else {
                // Exit pool
            }
        }
    }
}

export async function depositFunctionsBalanceHandler({ manager, signer }: { manager: CasimirManager, signer: SignerWithAddress }) {
    /**
     * In production, we check the functions balance before reporting
     * We can set processed to true if the manager has enough LINK tokens
     * Here, we're just depositing double the Chainlink registration minimum
     */
    const requiredBalance = 5

    const uniswapFactory = new Factory({
        provider: ethers.provider,
        uniswapV3FactoryAddress
    })

    const price = await uniswapFactory.getSwapPrice({
        tokenIn: wethTokenAddress,
        tokenOut: linkTokenAddress,
        uniswapFeeTier: 3000
    })

    const feeAmount = ethers.utils.parseEther((requiredBalance * price).toPrecision(9))
    const minTokenAmount = ethers.utils.parseEther((requiredBalance * 0.99).toPrecision(9))

    const depositFunctionsBalance = await manager.connect(signer).depositFunctionsBalance(
        feeAmount,
        minTokenAmount,
        false
    )
    await depositFunctionsBalance.wait()
}


export async function depositUpkeepBalanceHandler({ manager, signer }: { manager: CasimirManager, signer: SignerWithAddress }) {
    /**
     * In production, we check the upkeep balance before reporting
     * We can set processed to true if the manager has enough LINK tokens
     * Here, we're just depositing double the Chainlink registration minimum
     */
    const requiredBalance = 5

    const uniswapFactory = new Factory({
        provider: ethers.provider,
        uniswapV3FactoryAddress
    })

    const price = await uniswapFactory.getSwapPrice({ 
        tokenIn: wethTokenAddress,
        tokenOut: linkTokenAddress,
        uniswapFeeTier: 3000
    })
    
    const feeAmount = ethers.utils.parseEther((requiredBalance * price).toPrecision(9))
    const minTokenAmount = ethers.utils.parseEther((requiredBalance * 0.99).toPrecision(9))

    const depositUpkeepBalance = await manager.connect(signer).depositUpkeepBalance(
        feeAmount,
        minTokenAmount,
        false
    )
    await depositUpkeepBalance.wait()
}

export async function reportCompletedExitsHandler({ manager, views, signer, args }: { manager: CasimirManager, views: CasimirViews, signer: SignerWithAddress, args: Record<string, any> }) {
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
        const poolConfig = await views.getPoolConfig(poolId)
        if (poolConfig.status === PoolStatus.EXITING_FORCED || poolConfig.status === PoolStatus.EXITING_REQUESTED) {
            remaining--
            
            /**
             * In production, we use the SSV performance data to determine blame
             * We check all validators using:
             * const stakedPublicKeys = await views.getStakedPublicKeys(startIndex, endIndex)
             * Here, we're just hardcoding blame to the first operator if less than 32 ETH
             */
            const operatorIds = poolConfig.operatorIds.map((operatorId) => operatorId.toNumber())

            let blamePercents = [0, 0, 0, 0]
            if (poolConfig.balance.lt(ethers.utils.parseEther('32'))) {
                blamePercents = [100, 0, 0, 0]
            }

            const scanner = new Scanner({
                provider: ethers.provider,
                ssvNetworkAddress,
                ssvViewsAddress
            })

            const cluster = await scanner.getCluster({ 
                ownerAddress: manager.address,
                operatorIds
            })

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
