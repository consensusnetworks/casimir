import { ethers } from "ethers"
import { CasimirManager, CasimirRegistry, CasimirViews, IFunctionsBillingRegistry, IAutomationRegistry } from "@casimir/ethereum/build/@types"
import CasimirManagerAbi from "@casimir/ethereum/build/abi/CasimirManager.json"
import CasimirViewsAbi from "@casimir/ethereum/build/abi/CasimirViews.json"
import CasimirRegistryAbi from "@casimir/ethereum/build/abi/CasimirRegistry.json"
import IFunctionsBillingRegistryAbi from "@casimir/ethereum/build/abi/IFunctionsBillingRegistry.json"
import IAutomationRegistryAbi from "@casimir/ethereum/build/abi/IAutomationRegistry.json"
import { Scanner } from "@casimir/ssv"
import { PoolStatus } from "@casimir/types"
import { Factory } from "@casimir/uniswap"
import { getConfig } from "./config"
import { Dkg } from "./dkg"

const config = getConfig()

const cli = new Dkg({
  cliPath: config.cliPath,
  messengerUrl: config.messengerUrl
})

export async function depositFunctionsBalanceHandler() {
  const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
  const signer = config.wallet.connect(provider)
  const manager = new ethers.Contract(
    config.managerAddress, CasimirManagerAbi, signer
  ) as ethers.Contract & CasimirManager
  const functionsBillingRegistry = new ethers.Contract(
    config.functionsBillingRegistryAddress, IFunctionsBillingRegistryAbi, provider
  ) as ethers.Contract & IFunctionsBillingRegistry

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
    const minimumTokenAmount = ethers.utils.parseEther((refundBalance * 0.99).toPrecision(9))

    const depositFunctionsBalance = await manager.connect(signer).depositFunctionsBalance(
      feeAmount,
      minimumTokenAmount,
      false
    )
    await depositFunctionsBalance.wait()
  }
}

export async function depositUpkeepBalanceHandler() {
  const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
  const signer = config.wallet.connect(provider)
  const manager = new ethers.Contract(
    config.managerAddress, CasimirManagerAbi, signer
  ) as ethers.Contract & CasimirManager
  const keeperRegistry = new ethers.Contract(
    config.keeperRegistryAddress, IAutomationRegistryAbi, provider
  ) as ethers.Contract & IAutomationRegistry

  const minimumBalance = 0.2
  const refundBalance = 5
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
    const minimumTokenAmount = ethers.utils.parseEther((refundBalance * 0.99).toPrecision(9))    

    const depositUpkeepBalance = await manager.connect(signer).depositUpkeepBalance(
      feeAmount,
      minimumTokenAmount,
      false
    )
    await depositUpkeepBalance.wait()
  }
}

export async function initiateDepositHandler(input: ethers.utils.Result) {
  const { poolId } = input
  if (!poolId) throw new Error("No pool id provided")

  const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
  const signer = config.wallet.connect(provider)
  const manager = new ethers.Contract(
    config.managerAddress, CasimirManagerAbi, signer
  ) as ethers.Contract & CasimirManager
  const views = new ethers.Contract(
    config.viewsAddress, CasimirViewsAbi, provider
  ) as ethers.Contract & CasimirViews
  const registry = new ethers.Contract(
    config.registryAddress, CasimirRegistryAbi, provider
  ) as ethers.Contract & CasimirRegistry

  const managerNonce = await provider.getTransactionCount(manager.address)
  const poolAddress = ethers.utils.getContractAddress({
    from: manager.address,
    nonce: managerNonce
  })

  const operatorCount = (await registry.getOperatorIds()).length
  const operators = await views.getOperators(0, operatorCount)

  const eligibleOperators = operators.filter((operator) => {
    const availableCollateral = 
      parseInt(ethers.utils.formatEther(operator.collateral)) - parseInt(operator.poolCount.toString())
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

  const cluster = await scanner.getCluster({ 
    operatorIds: selectedOperatorIds,
    ownerAddress: manager.address
  })

  const ownerNonce = await scanner.getNonce(manager.address)

  const requiredFee = await scanner.getRequiredFee(selectedOperatorIds)

  const validator = await cli.createValidator({
    poolId,
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

  const feeAmount = ethers.utils.parseEther(
    (Number(ethers.utils.formatEther(requiredFee)) * Number(price)).toPrecision(9)
  )
  const minimumTokenAmount = ethers.utils.parseEther(
    (Number(ethers.utils.formatEther(requiredFee)) * 0.99).toPrecision(9)
  )

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

export async function reportResharesHandler(input: ethers.utils.Result) {
  const { operatorId } = input
  if (!operatorId) throw new Error("No operator id provided")

  const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
  const signer = config.wallet.connect(provider)
  const manager = new ethers.Contract(
    config.managerAddress, CasimirManagerAbi, signer
  ) as ethers.Contract & CasimirManager
  const views = new ethers.Contract(
    config.viewsAddress, CasimirViewsAbi, provider
  ) as ethers.Contract & CasimirViews
  const registry = new ethers.Contract(
    config.registryAddress, CasimirRegistryAbi, provider
  ) as ethers.Contract & CasimirRegistry

  const poolIds = [
    ...await manager.getPendingPoolIds(),
    ...await manager.getStakedPoolIds()
  ]

  for (const poolId of poolIds) {
    const poolDetails = await views.getPool(poolId)
    const oldOperatorIds = poolDetails.operatorIds.map(id => id.toNumber())
    if (oldOperatorIds.includes(operatorId)) {
      const poolAddress = await manager.getPoolAddress(poolId)

      const operatorCount = (await registry.getOperatorIds()).length
      const operators = await views.getOperators(0, operatorCount)
        
      const eligibleOperators = operators.filter((operator) => {
        const availableCollateral = 
          parseInt(ethers.utils.formatEther(operator.collateral)) - parseInt(operator.poolCount.toString())
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

      if (newOperatorId && poolDetails.reshares.toNumber() < 2) {
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
    
        const reshare = await cli.reshareValidator({ 
          publicKey: poolDetails.publicKey,
          poolId,
          oldOperatorIds,
          operatorIds,
          ownerAddress: manager.address,
          ownerNonce,
          withdrawalAddress: poolAddress
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
            
        const feeAmount = ethers.utils.parseEther(
          (Number(ethers.utils.formatEther(requiredFee.sub(oldCluster.balance))) * Number(price)).toPrecision(9)
        )
        const minimumTokenAmount = ethers.utils.parseEther(
          (Number(ethers.utils.formatEther(requiredFee.sub(oldCluster.balance))) * 0.99).toPrecision(9)
        )

        const reportReshare = await manager.reportReshare(
          poolId,
          operatorIds,
          oldOperatorIds,
          newOperatorId,
          operatorId,
          reshare.shares,
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

export async function initiateExitsHandler(input: ethers.utils.Result) {
  const { poolId } = input
  if (!poolId) throw new Error("No pool id provided")

  const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
  const manager = new ethers.Contract(
    config.managerAddress, CasimirManagerAbi, provider
  ) as ethers.Contract & CasimirManager
  const views = new ethers.Contract(
    config.viewsAddress, CasimirViewsAbi, provider
  ) as ethers.Contract & CasimirViews

  // Get pool to exit
  const poolDetails = await views.getPool(poolId)

  // Get operators to sign exit
}

export async function reportForcedExitsHandler(input: ethers.utils.Result) {
  const { count } = input
  if (!count) throw new Error("No count provided")

  const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
  const signer = config.wallet.connect(provider)
  const manager = new ethers.Contract(
    config.managerAddress, CasimirManagerAbi, signer
  ) as ethers.Contract & CasimirManager
  const views = new ethers.Contract(
    config.viewsAddress, CasimirViewsAbi, provider
  ) as ethers.Contract & CasimirViews

  const stakedPoolIds = await manager.getStakedPoolIds()
  let poolIndex = 0
  let remaining = count
  while (remaining > 0) {
    const poolId = stakedPoolIds[poolIndex]
    const poolDetails = await views.getPool(poolId)
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

export async function reportCompletedExitsHandler(input: ethers.utils.Result) {
  const { count } = input
  if (!count) throw new Error("No count provided")

  const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
  const signer = config.wallet.connect(provider)
  const manager = new ethers.Contract(
    config.managerAddress, CasimirManagerAbi, signer
  ) as ethers.Contract & CasimirManager
  const views = new ethers.Contract(
    config.viewsAddress, CasimirViewsAbi, provider
  ) as ethers.Contract & CasimirViews

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
    const poolDetails = await views.getPool(poolId)
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
      if (poolDetails.balance.lt(ethers.utils.parseEther("32"))) {
        blamePercents = [100, 0, 0, 0]
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