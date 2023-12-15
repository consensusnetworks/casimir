import { ethers, upgrades } from "hardhat"
import { setBalance, time } from "@nomicfoundation/hardhat-network-helpers"
import { fulfillReport, runUpkeep } from "../helpers/upkeep"
import { round } from "../helpers/math"
import { updateValidatorsHandler } from "../helpers/oracle"
import { POOL_STATUS } from "@casimir/env"
import { run } from "@casimir/shell"
import { waitForNetwork } from "../helpers/network"
import requestConfig from "@casimir/functions/Functions-request-config"
import { CasimirFactory, CasimirManager, CasimirRegistry, CasimirUpkeep, CasimirViews, FunctionsBillingRegistry, FunctionsOracle } from "../build/@types"
import { Config } from "../helpers/config"

/**
 * Fork ethereum contracts and run a local development environment
 */
async function main() {
    const config = new Config()

    await waitForNetwork(ethers.provider)
    
    const [
        owner,
        daoOracle,
        donTransmitter
    ] = await ethers.getSigners()

    const functionsOracle = await ethers.getContractAt("FunctionsOracle", config.functionsOracleAddress) as FunctionsOracle
    const functionsBillingRegistry = await ethers.getContractAt("FunctionsBillingRegistry", config.functionsBillingRegistryAddress) as FunctionsBillingRegistry

    /**
     * Upgrade contracts with the current changes
     * Helpful also for adding hardhat/console to debug existing methods
     */
    if (process.env.UPGRADE_CONTRACTS === "true") {
        upgrades.silenceWarnings()

        const factoryProxyFactory = await ethers.getContractFactory("CasimirFactory", {
            libraries: {
                CasimirBeacon: config.beaconLibraryAddress
            }
        })
        const factoryProxy = await upgrades.upgradeProxy(config.factoryAddress, factoryProxyFactory, {
            constructorArgs: [
                config.managerBeaconAddress,
                config.poolBeaconAddress,
                config.registryBeaconAddress,
                config.upkeepBeaconAddress,
                config.viewsBeaconAddress
            ],
            unsafeAllow: ["external-library-linking"] 
        })
        await factoryProxy.deployed()

        const managerBeaconFactory = await ethers.getContractFactory("CasimirManager", {
            libraries: {
                CasimirBeacon: config.beaconLibraryAddress
            }
        })
        const managerBeacon = await upgrades.upgradeBeacon(config.managerBeaconAddress, managerBeaconFactory, {
            constructorArgs: [
                config.functionsBillingRegistryAddress,
                config.keeperRegistrarAddress,
                config.keeperRegistryAddress,
                config.linkTokenAddress,
                config.ssvNetworkAddress,
                config.ssvTokenAddress,
                config.swapFactoryAddress,
                config.swapRouterAddress,
                config.wethTokenAddress
            ],
            unsafeAllow: ["external-library-linking"]
        })
        await managerBeacon.deployed()

        const poolBeaconFactory = await ethers.getContractFactory("CasimirPool")
        const poolBeacon = await upgrades.upgradeBeacon(config.poolBeaconAddress, poolBeaconFactory, {
            constructorArgs: [
                config.depositContractAddress,
                config.eigenpodManagerAddress
            ]
        })
        await poolBeacon.deployed()

        const registryBeaconFactory = await ethers.getContractFactory("CasimirRegistry")
        const registryBeacon = await upgrades.upgradeBeacon(config.registryBeaconAddress, registryBeaconFactory, { 
            constructorArgs: [
                config.ssvViewsAddress
            ]
        })
        await registryBeacon.deployed()

        const upkeepBeaconFactory = await ethers.getContractFactory("CasimirUpkeep")
        const upkeepBeacon = await upgrades.upgradeBeacon(config.upkeepBeaconAddress, upkeepBeaconFactory)
        await upkeepBeacon.deployed()

        const viewsBeaconFactory = await ethers.getContractFactory("CasimirViews")
        const viewsBeacon = await upgrades.upgradeBeacon(config.viewsBeaconAddress, viewsBeaconFactory)
        await viewsBeacon.deployed()
    }

    const factory = await ethers.getContractAt("CasimirFactory", config.factoryAddress) as CasimirFactory
    console.log(`Casimir factory ${factory.address}`)

    const [managerId] = await factory.getManagerIds()
    const managerConfig = await factory.getManagerConfig(managerId)

    const manager = await ethers.getContractAt("CasimirManager", managerConfig.managerAddress) as CasimirManager
    console.log(`Casimir simple stake manager ${manager.address}`)

    const registry = await ethers.getContractAt("CasimirRegistry", managerConfig.registryAddress) as CasimirRegistry
    console.log(`Casimir simple stake registry ${registry.address}`)

    const upkeep = await ethers.getContractAt("CasimirUpkeep", managerConfig.upkeepAddress) as CasimirUpkeep
    console.log(`Casimir simple stake upkeep ${upkeep.address}`)

    const views = await ethers.getContractAt("CasimirViews", managerConfig.viewsAddress) as CasimirViews
    console.log(`Casimir simple stake views ${views.address}`)
    
    const deployEigenManager = await factory.connect(owner).deployManager(
        daoOracle.address,
        functionsOracle.address,
        {
            minCollateral: ethers.utils.parseEther("1.0"),
            lockPeriod: ethers.BigNumber.from("0"),
            userFee: ethers.BigNumber.from("5"),
            compoundStake: true,
            eigenStake: true,
            liquidStake: false,
            privateOperators: false,
            verifiedOperators: false
        }
    )
    await deployEigenManager.wait()
    const [, eigenManagerId] = await factory.getManagerIds()
    const eigenManagerConfig = await factory.getManagerConfig(eigenManagerId)

    const eigenManager = await ethers.getContractAt("CasimirManager", eigenManagerConfig.managerAddress) as CasimirManager
    console.log(`Casimir simple restake manager ${eigenManager.address}`)
    const eigenRegistry = await ethers.getContractAt("CasimirRegistry", eigenManagerConfig.registryAddress) as CasimirRegistry
    console.log(`Casimir simple restake registry ${eigenRegistry.address}`)
    const eigenUpkeep = await ethers.getContractAt("CasimirUpkeep", eigenManagerConfig.upkeepAddress) as CasimirUpkeep
    console.log(`Casimir simple restake upkeep ${eigenUpkeep.address}`)
    const eigenViews = await ethers.getContractAt("CasimirViews", eigenManagerConfig.viewsAddress) as CasimirViews
    console.log(`Casimir simple restake views ${eigenViews.address}`)

    requestConfig.args[1] = eigenViews.address
    await (await eigenUpkeep.connect(owner).setFunctionsRequest(
        requestConfig.source, requestConfig.args, 300000
    )).wait()

    const functionsOracleSenders = await functionsOracle.getAuthorizedSenders()
    await functionsOracle.connect(owner).setAuthorizedSenders([
        ...functionsOracleSenders,
        eigenManager.address,
        eigenUpkeep.address
    ])

    /**
     * Simulate oracle reporting on a higher than average rate
     * Exit balances are swept as needed
     */
    if (process.env.SIMULATE_REPORTING === "true") {
        const blocksPerReport = 10
        const rewardPerValidator = 0.105
        let lastReportBlock = await ethers.provider.getBlockNumber()
        let lastStakedPoolIds: number[] = []
        ethers.provider.on("block", async (block) => {
            if (block - blocksPerReport >= lastReportBlock) {
                console.log("🧾 Generating report")
                lastReportBlock = await ethers.provider.getBlockNumber()

                await time.increase(time.duration.days(1))

                const pendingPoolIds = await manager.getPendingPoolIds()
                const activatableValidators = pendingPoolIds.length
                if (activatableValidators) {
                    await updateValidatorsHandler({ 
                        manager, 
                        provider: ethers.provider,
                        signer: daoOracle, 
                        activatableValidators
                    })
                }

                await runUpkeep({ donTransmitter, upkeep })

                const stakedPoolIds = await manager.getStakedPoolIds()
                if (pendingPoolIds.length + stakedPoolIds.length) {
                    const activatedBalance = activatableValidators * 32
                    const sweptRewardBalance = rewardPerValidator * lastStakedPoolIds.length
                    const exitingPoolCount = await manager.requestedExits()
                    const sweptExitedBalance = exitingPoolCount.toNumber() * 32
                    const rewardBalance = rewardPerValidator * stakedPoolIds.length
                    const latestBeaconBalance = parseFloat(ethers.utils.formatEther(
                        await manager.latestBeaconBalance()
                    ))

                    const nextBeaconBalance = round(
                        latestBeaconBalance
                        + activatedBalance
                        + rewardBalance
                        - sweptRewardBalance 
                        - sweptExitedBalance,
                        10
                    )

                    for (const poolId of lastStakedPoolIds) {
                        const poolAddress = await manager.getPoolAddress(poolId)
                        const currentBalance = await ethers.provider.getBalance(poolAddress)
                        const nextBalance = currentBalance.add(
                            ethers.utils.parseEther(rewardPerValidator.toString())
                        )
                        await setBalance(poolAddress, nextBalance)
                    }

                    const startIndex = ethers.BigNumber.from(0)
                    const endIndex = ethers.BigNumber.from(stakedPoolIds.length)
                    const compoundablePoolIds = await views.getCompoundablePoolIds(startIndex, endIndex)
                    const reportValues = {
                        beaconBalance: nextBeaconBalance,
                        sweptBalance: sweptRewardBalance + sweptExitedBalance,
                        compoundablePoolIds,
                        withdrawnValidators: exitingPoolCount.toNumber()
                    }
                    console.log("🧾 Report values", reportValues)

                    await fulfillReport({
                        donTransmitter,
                        upkeep,
                        functionsBillingRegistry,
                        values: reportValues
                    })
                    let remaining = exitingPoolCount.toNumber()
                    if (remaining) {
                        for (const poolId of stakedPoolIds) {
                            if (remaining === 0) break
                            const poolConfig = await views.getPoolConfig(poolId)
                            if (poolConfig.status === POOL_STATUS.EXITING_FORCED 
                                || poolConfig.status === POOL_STATUS.EXITING_REQUESTED) {
                                remaining--
                                const poolAddress = await manager.getPoolAddress(poolId)
                                const currentBalance = await ethers.provider.getBalance(poolAddress)
                                const poolSweptExitedBalance = sweptExitedBalance / exitingPoolCount.toNumber()
                                const nextBalance = currentBalance.add(
                                    ethers.utils.parseEther(poolSweptExitedBalance.toString())
                                )
                                await setBalance(poolAddress, nextBalance)
                            }
                        }
                        let finalizableWithdrawnValidators = await manager.finalizableWithdrawnValidators()
                        while (finalizableWithdrawnValidators.toNumber() !== exitingPoolCount.toNumber()) {
                            finalizableWithdrawnValidators = await manager.finalizableWithdrawnValidators()
                        }
                    }

                    await runUpkeep({ donTransmitter, upkeep })
                }
                lastStakedPoolIds = stakedPoolIds
            }
        })
    }

    run("npm run dev --workspace @casimir/oracle")
}

main().catch(error => {
    console.error(error)
    process.exit(1)
})