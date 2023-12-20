import { ethers } from "ethers"
import { CasimirManager, CasimirPool, CasimirViews, IERC20 } from "@casimir/ethereum/build/@types"
import ICasimirManagerAbi from "@casimir/ethereum/build/abi/ICasimirManager.json"
import ICasimirViewsAbi from "@casimir/ethereum/build/abi/ICasimirViews.json"
import ICasimirPoolAbi from "@casimir/ethereum/build/abi/ICasimirPool.json"
import IERC20Abi from "@casimir/ethereum/build/abi/IERC20.json"
import { Config } from "../providers/config"
import { Beacon } from "../providers/beacon"
import { HandlerInput } from "../interfaces/HandlerInput"
import { Swap } from "@casimir/uniswap"
import { Scanner } from "@casimir/ssv"
import { POOL_STATUS } from "@casimir/env"

export async function mockValidatorHandler() {
    const config = new Config()
    const beacon = new Beacon(config.ethereumBeaconUrl)

    const mockPublicKey1 = "0xa7585c58979d5782792a28464fd1a70113d7af9998fd1734725cdf765741a3c24ffec02c5851fe3e94ef0c984872b70e"
    const mockValidator1 = await beacon.getValidator(mockPublicKey1)

    const mockPublicKey2 = "0x8ee471282cd10a070b4baaae1c72036164da928786b1b70bbbbdd5430c5554d0debf8b3f47214a2792a16b44d9e6fe5d"
    const mockValidator2 = await beacon.getValidator(mockPublicKey2)

    console.log("mockValidator1", mockValidator1)
    console.log("mockValidator2", mockValidator2)
}

export async function updateValidatorsHandler(input: HandlerInput) {
    const config = new Config()
    const beacon = new Beacon(config.ethereumBeaconUrl)
    const { managerConfigs, args } = input
    
    const slot = args?.slot
    const timestamp = args?.timestamp
    const blockRoot = args?.blockRoot
    if (!slot) throw new Error("No slot provided")
    if (!timestamp) throw new Error("No timestamp provided")
    if (!blockRoot) throw new Error("No block root provided")

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const signer = config.wallet.connect(provider)

    for (const { managerAddress, viewsAddress } of managerConfigs) {
        const manager = new ethers.Contract(managerAddress, ICasimirManagerAbi, provider) as CasimirManager
        const views = new ethers.Contract(viewsAddress, ICasimirViewsAbi, provider) as CasimirViews

        const pendingPoolIds = await manager.getPendingPoolIds()
        for (let i = 0; i < pendingPoolIds.length; i++) {
            const poolId = pendingPoolIds[i]
            const poolAddress = await manager.getPoolAddress(poolId)
            const pool = new ethers.Contract(poolAddress, ICasimirPoolAbi, provider) as CasimirPool
            const { publicKey } = await pool.getRegistration()
            const validator = await beacon.getValidator(publicKey, slot)
            if (validator) {
                // Todo check time from current epoch to activation epoch
                const poolId = pendingPoolIds[i]
                const poolConfig = await views.getPoolConfig(poolId)
                const operatorIds = poolConfig.operatorIds.map((operatorId) => operatorId.toNumber())
            
                const scanner = new Scanner({
                    ethereumUrl: config.ethereumUrl,
                    ssvNetworkAddress: config.ssvNetworkAddress,
                    ssvViewsAddress: config.ssvViewsAddress
                })
            
                const cluster = await scanner.getCluster({ 
                    ownerAddress: manager.address,
                    operatorIds
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
            
                const activateValidator = await manager.connect(signer).activateValidator(
                    i,
                    cluster,
                    feeAmount,
                    minTokenAmount,
                    processed
                )
                await activateValidator.wait()
            }
        }

        const stakedPoolIds = await manager.getStakedPoolIds()
        for (let i = 0; i < stakedPoolIds.length; i++) {
            const poolId = stakedPoolIds[i]
            const poolAddress = await manager.getPoolAddress(poolId)
            const pool = new ethers.Contract(poolAddress, ICasimirPoolAbi, provider) as CasimirPool
            const { publicKey, status } = await pool.getRegistration()
            const validator = await beacon.getValidator(publicKey, slot)
            if (validator) {
                console.log("validator status", validator.status)
                console.log("pool status", status)
            }
        }
        // Handle exiting (slashed or unslashed) validators
    }
}