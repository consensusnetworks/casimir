import { ethers } from "ethers"
import { CasimirManager, CasimirRegistry, CasimirViews, IERC20 } from "@casimir/ethereum/build/@types"
import ICasimirManagerAbi from "@casimir/ethereum/build/abi/ICasimirManager.json"
import ICasimirRegistryAbi from "@casimir/ethereum/build/abi/ICasimirRegistry.json"
import ICasimirViewsAbi from "@casimir/ethereum/build/abi/ICasimirViews.json"
import IERC20Abi from "@casimir/ethereum/build/abi/IERC20.json"
import { Scanner } from "@casimir/ssv"
import { Swap } from "@casimir/uniswap"
import { Config } from "../providers/config"
import { Dkg } from "../providers/dkg"
import { HandlerInput } from "../interfaces/HandlerInput"

export async function deactivateOperatorHandler(input: HandlerInput) {
    const config = new Config()
    const dkg = new Dkg({
        cliPath: config.cliPath,
        configPath: config.configPath
    })
    const { args, managerConfigs } = input
    const { managerAddress, registryAddress, viewsAddress } = managerConfigs[0]
    const operatorId = args?.operatorId
    if (!operatorId) throw new Error("No operator id provided")

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const signer = config.wallet.connect(provider)
    const manager = new ethers.Contract(managerAddress, ICasimirManagerAbi, signer) as ethers.Contract & CasimirManager
    const views = new ethers.Contract(viewsAddress, ICasimirViewsAbi, provider) as CasimirViews
    const registry = new ethers.Contract(
        registryAddress, ICasimirRegistryAbi, provider
    ) as CasimirRegistry

    const poolIds = [
        ...await manager.getPendingPoolIds(), ...await manager.getStakedPoolIds()
    ]

    for (const poolId of poolIds) {
        const poolConfig = await views.getPoolConfig(poolId)
        const oldOperatorIds = poolConfig.operatorIds.map(id => id.toNumber())
        if (oldOperatorIds.includes(operatorId)) {
            const poolAddress = await manager.getPoolAddress(poolId)

            const operatorCount = (await registry.getOperatorIds()).length
            const operators = await views.getOperators(0, operatorCount)
        
            const eligibleOperators = operators.filter((operator) => {
                const operatorCollateral = parseInt(ethers.utils.formatEther(operator.collateral))
                const operatorPoolCount = parseInt(operator.poolCount.toString())
                const availableCollateral = operatorCollateral - operatorPoolCount
                return operator.active && !operator.resharing && availableCollateral > 0
            })
        
            const smallestOperators = eligibleOperators.sort((a, b) => {
                const aPoolCount = parseInt(a.poolCount.toString())
                const bPoolCount = parseInt(b.poolCount.toString())
                if (aPoolCount < bPoolCount) return -1
                if (aPoolCount > bPoolCount) return 1
                return 0
            })
        
            const newOperatorId = smallestOperators
                .find((operator) => !oldOperatorIds.includes(operator.id.toNumber()))?.id.toNumber()
            console.log("🤖 New selected operator", newOperatorId)

            if (newOperatorId && poolConfig.reshares.toNumber() < 2) {
                const operatorIds = oldOperatorIds.map((id) => {
                    if (id === operatorId) return newOperatorId
                    return id
                })
    
                const scanner = new Scanner({ 
                    ethereumUrl: config.ethereumUrl,
                    ssvNetworkAddress: config.ssvNetworkAddress,
                    ssvViewsAddress: config.ssvViewsAddress
                })
    
                const oldCluster = await scanner.getCluster({
                    operatorIds: oldOperatorIds,
                    ownerAddress: manager.address
                })
            
                const cluster = await scanner.getCluster({ 
                    operatorIds,
                    ownerAddress: manager.address
                })
            
                const ownerNonce = await scanner.getNonce(manager.address)
                
                const reshare = await dkg.reshare({ 
                    oldOperatorIds,
                    operatorIds,
                    poolId,
                    publicKey: poolConfig.publicKey
                })
    
                const requiredBalance = await scanner.getRequiredBalance(operatorIds)
                const ssvToken = new ethers.Contract(config.ssvTokenAddress, IERC20Abi, provider) as IERC20
                
                let feeAmount = requiredBalance
                let processed = true
                const managerTokenBalance = await ssvToken.balanceOf(manager.address)
                if (managerTokenBalance.lt(requiredBalance)) {
                    const tokenBalance = await ssvToken.balanceOf(signer.address)
                    if (tokenBalance.lt(requiredBalance)) {
                        const swap = new Swap({ provider })
                        feeAmount = await swap.getOutQuote({ 
                            tokenIn: config.wethTokenAddress,
                            tokenOut: config.ssvTokenAddress,
                            feeTier: 3000,
                            amountOut: requiredBalance
                        })
                        processed = false
                    } else {
                        const transfer = await ssvToken.connect(signer).transfer(manager.address, requiredBalance)
                        await transfer.wait()
                    }
                }
                const minTokenAmount = requiredBalance.mul(9).div(10)

                const reshareValidator = await manager.reshareValidator(
                    poolId,
                    operatorIds,
                    newOperatorId,
                    operatorId,
                    reshare.shares,
                    cluster,
                    oldCluster,
                    feeAmount,
                    minTokenAmount,
                    processed
                )
                await reshareValidator.wait()
            } else {
                // Exit pool
            }
        }
    }
}