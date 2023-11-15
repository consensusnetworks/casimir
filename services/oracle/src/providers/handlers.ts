import { ethers } from "ethers"
import { CasimirManager, CasimirRegistry, CasimirViews, IFunctionsBillingRegistry, IAutomationRegistry } from "@casimir/ethereum/build/@types"
import ICasimirManagerAbi from "@casimir/ethereum/build/abi/CasimirManager.json"
import CasimirViewsAbi from "@casimir/ethereum/build/abi/CasimirViews.json"
import CasimirRegistryAbi from "@casimir/ethereum/build/abi/CasimirRegistry.json"
import IFunctionsBillingRegistryAbi from "@casimir/ethereum/build/abi/IFunctionsBillingRegistry.json"
import IAutomationRegistryAbi from "@casimir/ethereum/build/abi/IAutomationRegistry.json"
import { Scanner } from "@casimir/ssv"
import { PoolStatus } from "@casimir/types"
import { Factory } from "@casimir/uniswap"
import { getConfig } from "./config"
import { Dkg } from "./dkg"
import { HandlerInput } from "../interfaces/HandlerInput"

const config = getConfig()

const dkg = new Dkg({
	cliPath: config.cliPath,
	configPath: config.configPath
})

export async function depositFunctionsBalanceHandler(input: HandlerInput) {
	const { managerConfig } = input
	const { managerAddress } = managerConfig

	const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
	const signer = config.wallet.connect(provider)
	const manager = new ethers.Contract(managerAddress, ICasimirManagerAbi, signer) as CasimirManager
	const functionsBillingRegistry = new ethers.Contract(
		config.functionsBillingRegistryAddress, IFunctionsBillingRegistryAbi, provider
	) as IFunctionsBillingRegistry

	const minimumBalance = 0.2
	const refundBalance = 5
	const functionsId = await manager.functionsId()
	let balance = 0
	if (functionsId.gt(0)) {
		const subscription = await functionsBillingRegistry.getSubscription(functionsId)
		balance = Number(ethers.utils.formatEther(subscription.balance).split(".").map((part, index) => {
			if (index === 0) return part
			return part.slice(0, 1)
		}).join("."))
	}

	if (balance < minimumBalance) {
		const uniswapFactory = new Factory({
			provider,
			uniswapV3FactoryAddress: config.uniswapV3FactoryAddress
		})

		const price = await uniswapFactory.getSwapPrice({
			tokenIn: config.wethTokenAddress,
			tokenOut: config.linkTokenAddress,
			uniswapFeeTier: 3000
		})

		const feeAmount = ethers.utils.parseEther((refundBalance * price).toPrecision(9))
		const minTokenAmount = ethers.utils.parseEther((refundBalance * 0.9).toPrecision(9))

		const depositFunctionsBalance = await manager.connect(signer).depositFunctionsBalance(
			feeAmount,
			minTokenAmount,
			false
		)
		await depositFunctionsBalance.wait()
	}
}

export async function depositUpkeepBalanceHandler(input: HandlerInput) {
	const { managerConfig } = input
	const { managerAddress } = managerConfig

	const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
	const signer = config.wallet.connect(provider)
	const manager = new ethers.Contract(managerAddress, ICasimirManagerAbi, signer) as CasimirManager
	const keeperRegistry = new ethers.Contract(
		config.keeperRegistryAddress, IAutomationRegistryAbi, provider
	) as IAutomationRegistry

	const minimumBalance = 6.5
	const refundBalance = 13
	const upkeepId = await manager.upkeepId()
	let balance = 0
	if (upkeepId.gt(0)) {
		const subscription = await keeperRegistry.getUpkeep(upkeepId)
		balance = Number(ethers.utils.formatEther(subscription.balance).split(".").map((part, index) => {
			if (index === 0) return part
			return part.slice(0, 1)
		}).join("."))
	}

	if (balance < minimumBalance) {
		const uniswapFactory = new Factory({
			provider,
			uniswapV3FactoryAddress: config.uniswapV3FactoryAddress
		})

		const price = await uniswapFactory.getSwapPrice({
			tokenIn: config.wethTokenAddress,
			tokenOut: config.linkTokenAddress,
			uniswapFeeTier: 3000
		})

		const feeAmount = ethers.utils.parseEther((refundBalance * price).toPrecision(9))
		const minTokenAmount = ethers.utils.parseEther((refundBalance * 0.9).toPrecision(9))    

		const depositUpkeepBalance = await manager.connect(signer).depositUpkeepBalance(
			feeAmount,
			minTokenAmount,
			false
		)
		await depositUpkeepBalance.wait()
	}
}

export async function initiatePoolHandler(input: HandlerInput) {
	const { managerConfig, args } = input    
	const { managerAddress, registryAddress, viewsAddress } = managerConfig
	const poolId = args?.poolId
	if (!poolId) throw new Error("No pool id provided")

	const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
	const signer = config.wallet.connect(provider)
	const manager = new ethers.Contract(managerAddress, ICasimirManagerAbi, signer) as CasimirManager
	const views = new ethers.Contract(viewsAddress, CasimirViewsAbi, provider) as CasimirViews
	const registry = new ethers.Contract(
		registryAddress, CasimirRegistryAbi, provider
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

	const initiatePool = await manager.initiatePool(
		depositDataRoot,
		publicKey,
		signature,
		withdrawalCredentials,
		operatorIds,
		shares
	)
	await initiatePool.wait()
}

export async function activatePoolsHandler(input: HandlerInput) {
	const { managerConfig, args } = input
	const { managerAddress, viewsAddress } = managerConfig
	const count = args?.count
	if (!count) throw new Error("No count provided")
	console.log("🤖 Activate pools", count)

	const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
	const signer = config.wallet.connect(provider)
	const manager = new ethers.Contract(managerAddress, ICasimirManagerAbi, signer) as CasimirManager
	const views = new ethers.Contract(viewsAddress, CasimirViewsAbi, provider) as CasimirViews

	for (let i = 0; i < count; i++) {
		const pendingPoolIds = await manager.getPendingPoolIds()
		if (!pendingPoolIds.length) throw new Error("No pending pools")

		/**
         * In production, we check the pending pool status on Beacon before activating
         * Here, we're just grabbing the next pending pool
         */
		const pendingPoolIndex = 0
		const poolId = pendingPoolIds[pendingPoolIndex]
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
    
		const requiredFee = await scanner.getRequiredFee(operatorIds)
    
		const uniswapFactory = new Factory({
			ethereumUrl: config.ethereumUrl,
			uniswapV3FactoryAddress: config.uniswapV3FactoryAddress
		})
    
		const price = await uniswapFactory.getSwapPrice({ 
			tokenIn: config.wethTokenAddress,
			tokenOut: config.ssvTokenAddress,
			uniswapFeeTier: 3000
		})
    
		const feeAmount = 
            ethers.utils.parseEther((Number(ethers.utils.formatEther(requiredFee)) * price).toPrecision(9))
		const formattedRequiredFee = Number(ethers.utils.formatEther(requiredFee)) * 0.99
		const minTokenAmount = ethers.utils.parseEther((formattedRequiredFee).toPrecision(9))
    
		const activatePool = await manager.connect(signer).activatePool(
			pendingPoolIndex,
			cluster,
			feeAmount,
			minTokenAmount,
			false
		)
		await activatePool.wait()
	}
}

export async function resharePoolsHandler(input: HandlerInput) {
	const { args, managerConfig } = input
	const { managerAddress, registryAddress, viewsAddress } = managerConfig
	const operatorId = args?.operatorId
	if (!operatorId) throw new Error("No operator id provided")

	const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
	const signer = config.wallet.connect(provider)
	const manager = new ethers.Contract(managerAddress, ICasimirManagerAbi, signer) as ethers.Contract & CasimirManager
	const views = new ethers.Contract(viewsAddress, CasimirViewsAbi, provider) as CasimirViews
	const registry = new ethers.Contract(
		registryAddress, CasimirRegistryAbi, provider
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
        
			const newOperatorId = 
                smallestOperators.find((operator) => !oldOperatorIds.includes(operator.id.toNumber()))?.id.toNumber()
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
            
				const requiredFee = await scanner.getRequiredFee(operatorIds)
    
				const reshare = await dkg.reshare({ 
					oldOperatorIds,
					operatorIds,
					poolId,
					publicKey: poolConfig.publicKey
				})
    
				const uniswapFactory = new Factory({
					ethereumUrl: config.ethereumUrl,
					uniswapV3FactoryAddress: config.uniswapV3FactoryAddress
				})
            
				const price = await uniswapFactory.getSwapPrice({ 
					tokenIn: config.wethTokenAddress,
					tokenOut: config.ssvTokenAddress,
					uniswapFeeTier: 3000
				})
            
				const requiredFeeSubOldClusterBalance = requiredFee.sub(oldCluster.balance)
				const feeAmount = ethers.utils.parseEther(
					(Number(ethers.utils.formatEther(requiredFeeSubOldClusterBalance)) * Number(price)).toPrecision(9)
				)
				const minTokenAmount = ethers.utils.parseEther(
					(Number(ethers.utils.formatEther(requiredFee.sub(oldCluster.balance))) * 0.99).toPrecision(9)
				)

				const reportReshare = await manager.reportReshare(
					poolId,
					operatorIds,
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

export async function initiateExitsHandler(input: HandlerInput) {
	const { managerConfig, args } = input
	const { managerAddress, viewsAddress } = managerConfig
	const poolId = args?.poolId
	if (!poolId) throw new Error("No pool id provided")

	const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
	const manager = new ethers.Contract(managerAddress, ICasimirManagerAbi, provider) as CasimirManager
	const views = new ethers.Contract(viewsAddress, CasimirViewsAbi, provider) as CasimirViews

	// Get pool to exit
	const poolConfig = await views.getPoolConfig(poolId)

	// Get operators to sign exit
}

export async function reportForcedExitsHandler(input: HandlerInput) {
	const { managerConfig, args } = input
	const { managerAddress, viewsAddress } = managerConfig
	const count = args?.count
	if (!count) throw new Error("No count provided")

	const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
	const signer = config.wallet.connect(provider)
	const manager = new ethers.Contract(managerAddress, ICasimirManagerAbi, signer) as ethers.Contract & CasimirManager
	const views = new ethers.Contract(viewsAddress, CasimirViewsAbi, provider) as CasimirViews

	const stakedPoolIds = await manager.getStakedPoolIds()
	let poolIndex = 0
	let remaining = count
	while (remaining > 0) {
		const poolId = stakedPoolIds[poolIndex]
		const poolConfig = await views.getPoolConfig(poolId)
		if (poolConfig.status === PoolStatus.ACTIVE) {
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
	const { managerConfig, args } = input
	const { managerAddress, viewsAddress } = managerConfig
	const count = args?.count
	if (!count) throw new Error("No count provided")

	const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
	const signer = config.wallet.connect(provider)
	const manager = new ethers.Contract(managerAddress, ICasimirManagerAbi, signer) as CasimirManager
	const views = new ethers.Contract(viewsAddress, CasimirViewsAbi, provider) as CasimirViews

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
			let blamePercents = [0,
				0,
				0,
				0]
			if (poolConfig.balance.lt(ethers.utils.parseEther("32"))) {
				blamePercents = [100,
					0,
					0,
					0]
			}

			const scanner = new Scanner({
				ethereumUrl: config.ethereumUrl,
				ssvNetworkAddress: config.ssvNetworkAddress,
				ssvViewsAddress: config.ssvViewsAddress
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