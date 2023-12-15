import fs from "fs"
import { ethers } from "ethers"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { CasimirManager, CasimirPool, CasimirViews, IAutomationRegistry, IERC20, IFunctionsBillingRegistry } from "../build/@types"
import { POOL_STATUS } from "@casimir/env"
import { Validator/*, Reshare*/ } from "@casimir/types"
import { Scanner } from "@casimir/ssv"
import { Swap } from "@casimir/uniswap"
import { Config } from "./config"
import ICasimirPoolAbi from "../build/abi/ICasimirPool.json"
import IAutomationRegistryAbi from "../build/abi/IAutomationRegistry.json"
import IERC20Abi from "../build/abi/IERC20.json"

export async function fundAccountsHandler({ 
    manager, 
    functionsBillingRegistry,
    provider, 
    signer 
}: { 
    manager: CasimirManager,
    functionsBillingRegistry: IFunctionsBillingRegistry,
    provider: ethers.providers.JsonRpcProvider,
    signer: SignerWithAddress 
}) {
    const config = new Config()
    const linkToken = new ethers.Contract(config.linkTokenAddress, IERC20Abi, provider) as IERC20

    const functionsMinimumBalance = ethers.utils.parseEther("0.2")
    const functionsRefreshBalance = ethers.utils.parseEther("5")
    const functionsId = await manager.functionsId()
    let functionsBalance = ethers.utils.parseEther("0")
    if (functionsId.gt(0)) {
        const subscription = await functionsBillingRegistry.getSubscription(functionsId)
        functionsBalance = ethers.utils.parseEther(
            ethers.utils.formatEther(subscription.balance).split(".").map((part, index) => {
                if (index === 0) return part
                return part.slice(0, 1)
            }).join(".")
        )
    }

    if (functionsBalance.lt(functionsMinimumBalance)) {
        let feeAmount = functionsRefreshBalance
        let processed = true
        const managerLinkBalance = await linkToken.balanceOf(manager.address)
        if (managerLinkBalance.lt(functionsRefreshBalance)) {
            const tokenBalance = await linkToken.balanceOf(signer.address)
            if (tokenBalance.lt(functionsRefreshBalance)) {
                const swap = new Swap({ provider })
                feeAmount = await swap.getOutQuote({
                    tokenIn: config.wethTokenAddress,
                    tokenOut: config.linkTokenAddress,
                    feeTier: 3000,
                    amountOut: functionsRefreshBalance
                })
                processed = false
            } else {
                const transfer = await linkToken.connect(signer).transfer(manager.address, functionsRefreshBalance)
                await transfer.wait()
            }
        }
        const minTokenAmount = functionsRefreshBalance.mul(9).div(10)
        const depositFunctionsBalance = await manager.connect(signer).depositFunctionsBalance(
            feeAmount,
            minTokenAmount,
            processed
        )
        await depositFunctionsBalance.wait()
    }

    const keeperRegistry = new ethers.Contract(
        config.keeperRegistryAddress, IAutomationRegistryAbi, provider
    ) as IAutomationRegistry

    const upkeepMinimumBalance = ethers.utils.parseEther("6.5")
    const upkeepRefreshBalance = ethers.utils.parseEther("13")
    const upkeepId = await manager.upkeepId()
    let upkeepBalance = ethers.utils.parseEther("0")
    if (upkeepId.gt(0)) {
        const subscription = await keeperRegistry.getUpkeep(upkeepId)
        upkeepBalance = ethers.utils.parseEther(
            ethers.utils.formatEther(subscription.balance).split(".").map((part, index) => {
                if (index === 0) return part
                return part.slice(0, 1)
            }).join(".")
        )
    }

    if (upkeepBalance.lt(upkeepMinimumBalance)) {
        let feeAmount = upkeepRefreshBalance
        let processed = true
        const managerLinkBalance = await linkToken.balanceOf(manager.address)
        if (managerLinkBalance.lt(upkeepRefreshBalance)) {
            const tokenBalance = await linkToken.balanceOf(signer.address)
            if (tokenBalance.lt(upkeepRefreshBalance)) {
                const swap = new Swap({ provider })
                feeAmount = await swap.getOutQuote({
                    tokenIn: config.wethTokenAddress,
                    tokenOut: config.linkTokenAddress,
                    feeTier: 3000,
                    amountOut: upkeepRefreshBalance
                })
                processed = false
            } else {
                const transfer = await linkToken.connect(signer).transfer(manager.address, upkeepRefreshBalance)
                await transfer.wait()
            }
        }
        const minTokenAmount = upkeepRefreshBalance.mul(9).div(10)
        const depositUpkeepBalance = await manager.connect(signer).depositUpkeepBalance(
            feeAmount,
            minTokenAmount,
            processed
        )
        await depositUpkeepBalance.wait()
    }

    // Todo fund or rebalance SSV clusters
}

export async function initiateValidatorHandler({ 
    manager,
    provider,
    signer 
}: { 
    manager: CasimirManager,
    provider: ethers.providers.JsonRpcProvider,
    signer: SignerWithAddress 
}) {
    const keysDir = process.env.KEYS_DIR || "keys"
    let mockValidators: Record<string, Validator[]> = {}
    try {
        mockValidators = JSON.parse(fs.readFileSync(`${keysDir}/mock.validators.json`).toString())
    } catch (error) {
        throw new Error("No mock validator data found")
    }
    const signerMockValidators: Validator[] = mockValidators[signer.address]
    const nonce = await provider.getTransactionCount(manager.address)
    const poolAddress = ethers.utils.getContractAddress({
        from: manager.address,
        nonce
    })
    const poolWithdrawalCredentials = "0x" + "01" + "0".repeat(22) + poolAddress.split("0x")[1]
    const validator = signerMockValidators.find((validator) => {
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

    const initiateValidator = await manager.connect(signer).initiateValidator(
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares
    )
    await initiateValidator.wait()
}

export async function updateValidatorsHandler({ 
    manager,
    provider,
    signer,
    activatableValidators
}: { 
    manager: CasimirManager, 
    provider: ethers.providers.JsonRpcProvider,
    signer: SignerWithAddress, 
    activatableValidators: number
}) {
    const config = new Config()

    /**
     * In production, we check the pending pool status on Beacon before activating
     * Here, we're just grabbing the pending pools in order for the activatable validators
     */
    for (let i = 0; i < activatableValidators; i++) {
        const pendingPoolIds = await manager.getPendingPoolIds()
        if (!pendingPoolIds.length) throw new Error("No pending pools")
        const pendingPoolIndex = 0
        const poolId = pendingPoolIds[pendingPoolIndex]
        const poolAddress = await manager.getPoolAddress(poolId)
        const pool = new ethers.Contract(poolAddress, ICasimirPoolAbi, provider) as CasimirPool
        const poolRegistration = await pool.getRegistration()
        const operatorIds = poolRegistration.operatorIds.map((operatorId) => operatorId.toNumber())

        const scanner = new Scanner({
            provider,
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
            pendingPoolIndex,
            cluster,
            feeAmount,
            minTokenAmount,
            processed
        )
        await activateValidator.wait()
    }
}

export async function withdrawValidatorsHandler({ 
    manager, 
    provider,
    views, 
    signer, 
    args 
}: { 
    manager: CasimirManager, 
    provider: ethers.providers.JsonRpcProvider,
    views: CasimirViews, 
    signer: SignerWithAddress, 
    args: Record<string, any> 
}) {
    const config = new Config()
    const { count } = args

    /**
     * In production, we get the completed exit order from Beacon (sorting by withdrawn epoch)
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
        if (poolConfig.status === POOL_STATUS.EXITING_FORCED || poolConfig.status === POOL_STATUS.EXITING_REQUESTED) {
            remaining--
            
            /**
             * In production, we use the SSV performance data to determine blame
             * We check all validators using:
             * const stakedPublicKeys = await views.getStakedPublicKeys(startIndex, endIndex)
             * Here, we're just hardcoding blame to the first operator if less than 32 ETH
             */
            const operatorIds = poolConfig.operatorIds.map((operatorId) => operatorId.toNumber())

            let blamePercents = [0, 0, 0, 0]
            if (poolConfig.balance.lt(ethers.utils.parseEther("32"))) {
                blamePercents = [100, 0, 0, 0]
            }

            const scanner = new Scanner({
                provider,
                ssvNetworkAddress: config.ssvNetworkAddress,
                ssvViewsAddress: config.ssvViewsAddress
            })

            const cluster = await scanner.getCluster({ 
                ownerAddress: manager.address,
                operatorIds
            })

            const withdrawValidator = await manager.connect(signer).withdrawValidator(
                poolIndex,
                blamePercents,
                cluster
            )
            await withdrawValidator.wait()
        }
        poolIndex++
    }
}
