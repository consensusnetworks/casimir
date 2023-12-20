import { ethers } from "ethers"
import { CasimirManager, CasimirRegistry, CasimirViews } from "@casimir/ethereum/build/@types"
import ICasimirManagerAbi from "@casimir/ethereum/build/abi/ICasimirManager.json"
import ICasimirRegistryAbi from "@casimir/ethereum/build/abi/ICasimirRegistry.json"
import ICasimirViewsAbi from "@casimir/ethereum/build/abi/ICasimirViews.json"
import { Scanner } from "@casimir/ssv"
import { HandlerInput } from "../interfaces/HandlerInput"
import { Config } from "../providers/config"
import { Dkg } from "../providers/dkg"

export async function initiateValidatorHandler(input: HandlerInput) {
    const config = new Config()
    const dkg = new Dkg({
        cliPath: config.cliPath,
        configPath: config.configPath
    })
    const { managerConfigs, args } = input    
    const { managerAddress, registryAddress, viewsAddress } = managerConfigs[0]
    const poolId = args?.poolId
    if (!poolId) throw new Error("No pool id provided")

    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    const signer = config.wallet.connect(provider)
    const manager = new ethers.Contract(managerAddress, ICasimirManagerAbi, signer) as CasimirManager
    const views = new ethers.Contract(viewsAddress, ICasimirViewsAbi, provider) as CasimirViews
    const registry = new ethers.Contract(
        registryAddress, ICasimirRegistryAbi, provider
    ) as CasimirRegistry

    const managerNonce = await provider.getTransactionCount(manager.address)
    const poolAddress = ethers.utils.getContractAddress({
        from: manager.address,
        nonce: managerNonce
    })

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

    const selectedOperatorIds = smallestOperators.slice(0, 4).map((operator) => operator.id.toNumber())
    console.log("🤖 Selected operators", selectedOperatorIds)

    const scanner = new Scanner({ 
        ethereumUrl: config.ethereumUrl,
        ssvNetworkAddress: config.ssvNetworkAddress,
        ssvViewsAddress: config.ssvViewsAddress
    })

    const ownerNonce = await scanner.getNonce(manager.address)

    const validator = await dkg.init({
        operatorIds: selectedOperatorIds,
        ownerAddress: manager.address,
        ownerNonce,
        poolId,
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

    const initiateValidator = await manager.initiateValidator(
        depositDataRoot,
        publicKey,
        signature,
        withdrawalCredentials,
        operatorIds,
        shares
    )
    await initiateValidator.wait()
}