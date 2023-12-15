import { ethers } from "ethers"
import { CasimirManager, IFunctionsBillingRegistry, IAutomationRegistry, IERC20 } from "@casimir/ethereum/build/@types"
import ICasimirManagerAbi from "@casimir/ethereum/build/abi/ICasimirManager.json"
import IFunctionsBillingRegistryAbi from "@casimir/ethereum/build/abi/IFunctionsBillingRegistry.json"
import IAutomationRegistryAbi from "@casimir/ethereum/build/abi/IAutomationRegistry.json"
import IERC20Abi from "@casimir/ethereum/build/abi/IERC20.json"
import { Swap } from "@casimir/uniswap"
import { HandlerInput } from "../interfaces/HandlerInput"
import { Config } from "../providers/config"

export async function fundAccountsHandler(input: HandlerInput) {
    const config = new Config()
    const { managerConfigs } = input
    const { managerAddress } = managerConfigs[0]

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const signer = config.wallet.connect(provider)
    const manager = new ethers.Contract(managerAddress, ICasimirManagerAbi, signer) as CasimirManager
    const functionsBillingRegistry = new ethers.Contract(
        config.functionsBillingRegistryAddress, IFunctionsBillingRegistryAbi, provider
    ) as IFunctionsBillingRegistry
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