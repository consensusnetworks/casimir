import { ethers, upgrades } from "hardhat"

/**
 * Upgrade ethereum contracts
 */
void async function () {
  // Redeploying functions billing registry for updates
  // if (!process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS) throw new Error('No functions billing registry address provided')
  if (!process.env.MANAGER_BEACON_ADDRESS) throw new Error("No manager beacon address provided")
  if (!process.env.POOL_BEACON_ADDRESS) throw new Error("No pool beacon address provided")
  if (!process.env.REGISTRY_BEACON_ADDRESS) throw new Error("No registry beacon address provided")
  if (!process.env.UPKEEP_BEACON_ADDRESS) throw new Error("No upkeep beacon address provided")
  if (!process.env.VIEWS_BEACON_ADDRESS) throw new Error("No views address provided")
  if (!process.env.FACTORY_ADDRESS) throw new Error("No factory address provided")
  if (!process.env.KEEPER_REGISTRAR_ADDRESS) throw new Error("No keeper registrar address provided")
  if (!process.env.KEEPER_REGISTRY_ADDRESS) throw new Error("No keeper registry address provided")
  if (!process.env.LINK_TOKEN_ADDRESS) throw new Error("No link token address provided")
  if (!process.env.SSV_NETWORK_ADDRESS) throw new Error("No ssv network address provided")
  if (!process.env.SSV_TOKEN_ADDRESS) throw new Error("No ssv token address provided")
  if (!process.env.SSV_VIEWS_ADDRESS) throw new Error("No ssv views address provided")
  if (!process.env.SWAP_FACTORY_ADDRESS) throw new Error("No swap factory address provided")
  if (!process.env.SWAP_ROUTER_ADDRESS) throw new Error("No swap router address provided")
  if (!process.env.WETH_TOKEN_ADDRESS) throw new Error("No weth token address provided")

  const [, , donTransmitter] = await ethers.getSigners()

  const functionsOracleFactoryFactory = await ethers.getContractFactory("FunctionsOracleFactory")
  const functionsOracleFactory = await functionsOracleFactoryFactory.deploy()
  await functionsOracleFactory.deployed()
  console.log(`FunctionsOracleFactory contract deployed to ${functionsOracleFactory.address}`)

  const deployNewOracle = await functionsOracleFactory.deployNewOracle()
  const deployNewOracleReceipt = await deployNewOracle.wait()
  if (!deployNewOracleReceipt.events) throw new Error("Functions oracle deployment failed")
  const functionsOracleAddress = deployNewOracleReceipt.events[1].args?.don as string
  const functionsOracle = await ethers.getContractAt("FunctionsOracle", functionsOracleAddress)
  const acceptOwnership = await functionsOracle.acceptOwnership()
  await acceptOwnership.wait()
  console.log(`FunctionsOracle contract deployed to ${functionsOracle.address}`)

  const functionsBillingRegistryArgs = {
    linkTokenAddress: process.env.LINK_TOKEN_ADDRESS,
    linkEthFeedAddress: process.env.LINK_ETH_FEED_ADDRESS,
    functionsOracleAddress: functionsOracle.address
  }
  const functionsBillingRegistryFactory = await ethers.getContractFactory("FunctionsBillingRegistry")
  const functionsBillingRegistry = await functionsBillingRegistryFactory.deploy(...Object.values(functionsBillingRegistryArgs))
  await functionsBillingRegistry.deployed()
  console.log(`FunctionsBillingRegistry contract deployed to ${functionsBillingRegistry.address}`)

  const functionsBillingRegistryConfig = {
    maxGasLimit: 400_000,
    stalenessSeconds: 86_400,
    gasAfterPaymentCalculation:
            21_000 + 5_000 + 2_100 + 20_000 + 2 * 2_100 - 15_000 + 7_315,
    weiPerUnitLink: ethers.BigNumber.from("5000000000000000"),
    gasOverhead: 100_000,
    requestTimeoutSeconds: 300,
  }

  await functionsBillingRegistry.setConfig(
    functionsBillingRegistryConfig.maxGasLimit,
    functionsBillingRegistryConfig.stalenessSeconds,
    functionsBillingRegistryConfig.gasAfterPaymentCalculation,
    functionsBillingRegistryConfig.weiPerUnitLink,
    functionsBillingRegistryConfig.gasOverhead,
    functionsBillingRegistryConfig.requestTimeoutSeconds
  )

  const beaconLibraryFactory = await ethers.getContractFactory("CasimirBeacon")
  const beaconLibrary = await beaconLibraryFactory.deploy()
  console.log(`CasimirBeacon library deployed at ${beaconLibrary.address}`)

  const managerBeaconFactory = await ethers.getContractFactory("CasimirManager", {
    libraries: {
      CasimirBeacon: beaconLibrary.address
    }
  })
  const managerBeacon = await upgrades.upgradeBeacon(process.env.MANAGER_BEACON_ADDRESS, managerBeaconFactory, { 
    constructorArgs: [
      functionsBillingRegistry.address,
            process.env.KEEPER_REGISTRAR_ADDRESS as string,
            process.env.KEEPER_REGISTRY_ADDRESS as string,
            process.env.LINK_TOKEN_ADDRESS as string,
            process.env.SSV_NETWORK_ADDRESS as string,
            process.env.SSV_TOKEN_ADDRESS as string,
            process.env.SWAP_FACTORY_ADDRESS as string,
            process.env.SWAP_ROUTER_ADDRESS as string,
            process.env.WETH_TOKEN_ADDRESS as string
    ],
    unsafeAllow: ["external-library-linking"]
  })
  await managerBeacon.deployed()
  console.log(`CasimirManager beacon upgraded at ${managerBeacon.address}`)

  const poolBeaconFactory = await ethers.getContractFactory("CasimirPool")
  const poolBeacon = await upgrades.upgradeBeacon(process.env.POOL_BEACON_ADDRESS, poolBeaconFactory, {
    constructorArgs: [
            process.env.DEPOSIT_CONTRACT_ADDRESS as string
    ]
  })
  await poolBeacon.deployed()
  console.log(`CasimirPool beacon upgraded at ${poolBeacon.address}`)

  const registryBeaconFactory = await ethers.getContractFactory("CasimirRegistry")
  const registryBeacon = await upgrades.upgradeBeacon(process.env.REGISTRY_BEACON_ADDRESS, registryBeaconFactory, { 
    constructorArgs: [
            process.env.SSV_VIEWS_ADDRESS as string
    ]
  })
  await registryBeacon.deployed()
  console.log(`CasimirRegistry beacon upgraded at ${registryBeacon.address}`)

  const upkeepBeaconFactory = await ethers.getContractFactory("CasimirUpkeep")
  const upkeepBeacon = await upgrades.upgradeBeacon(process.env.UPKEEP_BEACON_ADDRESS, upkeepBeaconFactory)
  await upkeepBeacon.deployed()
  console.log(`CasimirUpkeep beacon upgraded at ${upkeepBeacon.address}`)
    
  const viewsBeaconFactory = await ethers.getContractFactory("CasimirViews")
  const viewsBeacon = await upgrades.upgradeBeacon(process.env.VIEWS_BEACON_ADDRESS, viewsBeaconFactory)
  await viewsBeacon.deployed()
  console.log(`CasimirViews beacon upgraded at ${viewsBeacon.address}`)

  const factoryFactory = await ethers.getContractFactory("CasimirFactory", {
    libraries: {
      CasimirBeacon: beaconLibrary.address
    }
  })
  const factory = await upgrades.upgradeProxy(process.env.FACTORY_ADDRESS, factoryFactory, {
    constructorArgs: [
      managerBeacon.address,
      poolBeacon.address,
      registryBeacon.address,
      upkeepBeacon.address,
      viewsBeacon.address
    ],
    unsafeAllow: ["external-library-linking"] 
  })
  await factory.deployed()
  console.log(`CasimirFactory contract upgraded at ${factory.address}`)

    
  const [managerId] = await factory.getManagerIds()
  const managerConfig = await factory.getManagerConfig(managerId)
  const upkeep = await ethers.getContractAt("CasimirUpkeep", managerConfig.upkeepAddress)
  await upkeep.setFunctionsOracle(functionsOracle.address)
  await functionsBillingRegistry.setAuthorizedSenders([functionsOracle.address, donTransmitter.address])
  await functionsOracle.setAuthorizedSenders([donTransmitter.address,
    managerConfig.managerAddress,
    managerConfig.upkeepAddress])
  await functionsOracle.setRegistry(functionsBillingRegistry.address)
}()