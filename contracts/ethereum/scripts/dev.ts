import { CasimirFactoryDev, CasimirManagerDev, CasimirRegistryDev, CasimirUpkeepDev, CasimirViewsDev, FunctionsOracle, FunctionsBillingRegistry } from "../build/@types"
import { ethers, upgrades } from "hardhat"
import { time, setBalance } from "@nomicfoundation/hardhat-network-helpers"
import { PoolStatus } from "@casimir/types"
import requestConfig from "@casimir/functions/Functions-request-config"
import { run } from "@casimir/shell"
import { round } from "../helpers/math"
import { waitForNetwork } from "../helpers/network"
import { activatePoolsHandler } from "../helpers/oracle"
import { fulfillReport, runUpkeep } from "../helpers/upkeep"

/**
 * Fork contracts to local network and run local events and oracle handling
 * You can override the following configuration environment variables:
 * - SIMULATE_UPGRADES: true | false
 * - SIMULATE_EIGEN: true | false
 * - SIMULATE_REWARDS: true | false
 */
async function dev() {
    if (!process.env.FACTORY_ADDRESS) throw new Error("No factory address provided")
    if (!process.env.MANAGER_BEACON_ADDRESS) throw new Error("No manager beacon address provided")
    if (!process.env.POOL_BEACON_ADDRESS) throw new Error("No pool beacon address provided")
    if (!process.env.REGISTRY_BEACON_ADDRESS) throw new Error("No registry beacon address provided")
    if (!process.env.UPKEEP_BEACON_ADDRESS) throw new Error("No upkeep beacon address provided")
    if (!process.env.VIEWS_BEACON_ADDRESS) throw new Error("No views beacon address provided")
    if (!process.env.BEACON_LIBRARY_ADDRESS) throw new Error("No beacon library address provided")
    if (!process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS) throw new Error("No functions billing registry address provided")
    if (!process.env.FUNCTIONS_ORACLE_ADDRESS) throw new Error("No functions oracle address provided")
    if (!process.env.DEPOSIT_CONTRACT_ADDRESS) throw new Error("No deposit contract address provided")
    if (!process.env.KEEPER_REGISTRAR_ADDRESS) throw new Error("No keeper registrar address provided")
    if (!process.env.KEEPER_REGISTRY_ADDRESS) throw new Error("No keeper registry address provided")
    if (!process.env.LINK_TOKEN_ADDRESS) throw new Error("No link token address provided")
    if (!process.env.LINK_ETH_FEED_ADDRESS) throw new Error("No link eth feed address provided")
    if (!process.env.SSV_NETWORK_ADDRESS) throw new Error("No ssv network address provided")
    if (!process.env.SSV_TOKEN_ADDRESS) throw new Error("No ssv token address provided")
    if (!process.env.SWAP_FACTORY_ADDRESS) throw new Error("No swap factory address provided")
    if (!process.env.SWAP_ROUTER_ADDRESS) throw new Error("No swap router address provided")
    if (!process.env.WETH_TOKEN_ADDRESS) throw new Error("No weth token address provided")

    await waitForNetwork(ethers.provider)

    const [owner,
        daoOracle,
        donTransmitter] = await ethers.getSigners()

    const functionsOracle = await ethers.getContractAt("FunctionsOracle", process.env.FUNCTIONS_ORACLE_ADDRESS) as FunctionsOracle
    const functionsBillingRegistry = await ethers.getContractAt("FunctionsBillingRegistry", process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS) as FunctionsBillingRegistry

    /**
     * Deploy in-development contract upgrades
     * Helpful also for adding hardhat/console to debug existing methods
     */
    if (process.env.SIMULATE_UPGRADES === "true") {
        upgrades.silenceWarnings()

        const factoryProxyFactory = await ethers.getContractFactory("CasimirFactoryDev", {
            libraries: {
                CasimirBeacon: process.env.BEACON_LIBRARY_ADDRESS
            }
        })
        const factoryProxy = await upgrades.upgradeProxy(process.env.FACTORY_ADDRESS, factoryProxyFactory, {
            constructorArgs: [
                process.env.MANAGER_BEACON_ADDRESS,
                process.env.POOL_BEACON_ADDRESS,
                process.env.REGISTRY_BEACON_ADDRESS,
                process.env.UPKEEP_BEACON_ADDRESS,
                process.env.VIEWS_BEACON_ADDRESS
            ],
            unsafeAllow: ["external-library-linking"] 
        })
        await factoryProxy.deployed()

        const managerBeaconFactory = await ethers.getContractFactory("CasimirManagerDev", {
            libraries: {
                CasimirBeacon: process.env.BEACON_LIBRARY_ADDRESS
            }
        })
        const managerBeacon = await upgrades.upgradeBeacon(process.env.MANAGER_BEACON_ADDRESS, managerBeaconFactory, {
            constructorArgs: [
                process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS,
                process.env.KEEPER_REGISTRAR_ADDRESS,
                process.env.KEEPER_REGISTRY_ADDRESS,
                process.env.LINK_TOKEN_ADDRESS,
                process.env.SSV_NETWORK_ADDRESS,
                process.env.SSV_TOKEN_ADDRESS,
                process.env.SWAP_FACTORY_ADDRESS,
                process.env.SWAP_ROUTER_ADDRESS,
                process.env.WETH_TOKEN_ADDRESS
            ],
            unsafeAllow: ["external-library-linking"]
        })
        await managerBeacon.deployed()

        const poolBeaconFactory = await ethers.getContractFactory("CasimirPoolDev")
        const poolBeacon = await upgrades.upgradeBeacon(process.env.POOL_BEACON_ADDRESS, poolBeaconFactory, {
            constructorArgs: [
                process.env.DEPOSIT_CONTRACT_ADDRESS,
                process.env.EIGENPOD_MANAGER_ADDRESS
            ]
        })
        await poolBeacon.deployed()

        const registryBeaconFactory = await ethers.getContractFactory("CasimirRegistryDev")
        const registryBeacon = await upgrades
            .upgradeBeacon(process.env.REGISTRY_BEACON_ADDRESS, registryBeaconFactory, { 
                constructorArgs: [
                    process.env.SSV_VIEWS_ADDRESS
                ]
            })
        await registryBeacon.deployed()

        const upkeepBeaconFactory = await ethers.getContractFactory("CasimirUpkeepDev")
        const upkeepBeacon = await upgrades.upgradeBeacon(process.env.UPKEEP_BEACON_ADDRESS, upkeepBeaconFactory)
        await upkeepBeacon.deployed()

        const viewsBeaconFactory = await ethers.getContractFactory("CasimirViewsDev")
        const viewsBeacon = await upgrades.upgradeBeacon(process.env.VIEWS_BEACON_ADDRESS, viewsBeaconFactory)
        await viewsBeacon.deployed()
    }
    const factory = await ethers.getContractAt("CasimirFactoryDev", process.env.FACTORY_ADDRESS) as CasimirFactoryDev
    console.log(`Casimir factory ${factory.address}`)

    const [managerId] = await factory.getManagerIds()
    const managerConfig = await factory.getManagerConfig(managerId)

    const manager = await ethers.getContractAt("CasimirManagerDev", managerConfig.managerAddress) as CasimirManagerDev
    console.log(`Casimir simple manager ${manager.address}`)

    const registry = await ethers.getContractAt("CasimirRegistryDev", managerConfig.registryAddress) as CasimirRegistryDev
    console.log(`Casimir simple registry ${registry.address}`)

    const upkeep = await ethers.getContractAt("CasimirUpkeepDev", managerConfig.upkeepAddress) as CasimirUpkeepDev
    console.log(`Casimir simple upkeep ${upkeep.address}`)

    const views = await ethers.getContractAt("CasimirViewsDev", managerConfig.viewsAddress) as CasimirViewsDev
    console.log(`Casimir simple views ${views.address}`)
    
    /**
     * Deploy a second operator groups with Casimir Eigen stake enabled
     * Note, this operator group is not functional it only deployed for testing purposes
     */
    if (process.env.SIMULATE_EIGEN === "true") {
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

        const eigenManager = await ethers.getContractAt("CasimirManagerDev", eigenManagerConfig.managerAddress) as CasimirManagerDev
        console.log(`Casimir Eigen manager ${eigenManager.address}`)
        const eigenRegistry = await ethers.getContractAt("CasimirRegistryDev", eigenManagerConfig.registryAddress) as CasimirRegistryDev
        console.log(`Casimir Eigen registry ${eigenRegistry.address}`)
        const eigenUpkeep = await ethers.getContractAt("CasimirUpkeepDev", eigenManagerConfig.upkeepAddress) as CasimirUpkeepDev
        console.log(`Casimir Eigen upkeep ${eigenUpkeep.address}`)
        const eigenViews = await ethers.getContractAt("CasimirViewsDev", eigenManagerConfig.viewsAddress) as CasimirViewsDev
        console.log(`Casimir Eigen views ${eigenViews.address}`)

        requestConfig.args[1] = eigenViews.address
        await (await eigenUpkeep.connect(owner).setFunctionsRequest(
            requestConfig.source, requestConfig.args, 300000
        )).wait()

        const functionsOracleSenders = await functionsOracle.getAuthorizedSenders()
        const newFunctionsOracleSenders = [
            ...functionsOracleSenders,
            eigenManager.address,
            eigenUpkeep.address
        ]
        await functionsOracle.connect(owner).setAuthorizedSenders(newFunctionsOracleSenders)
    }

    /**
     * Simulate oracle reporting on a higher than average rate
     * Exit balances are swept as needed
     */
    if (process.env.SIMULATE_REWARDS === "true") {
        const blocksPerReport = 10
        const rewardPerValidator = 0.105
        let lastReportBlock = await ethers.provider.getBlockNumber()
        let lastStakedPoolIds: number[] = []
        ethers.provider.on("block", async (block) => {
            if (block - blocksPerReport >= lastReportBlock) {
                await time.increase(time.duration.days(1))
                console.log("⌛️ Report period complete")
                lastReportBlock = await ethers.provider.getBlockNumber()
                await runUpkeep({ donTransmitter, upkeep })
                const pendingPoolIds = await manager.getPendingPoolIds()
                const stakedPoolIds = await manager.getStakedPoolIds()
                if (pendingPoolIds.length + stakedPoolIds.length) {
                    console.log("🧾 Submitting report")
                    const activatedPoolCount = pendingPoolIds.length
                    const activatedBalance = activatedPoolCount * 32
                    const sweptRewardBalance = rewardPerValidator * lastStakedPoolIds.length
                    const exitingPoolCount = await manager.requestedExits()
                    const sweptExitedBalance = exitingPoolCount.toNumber() * 32
                    const rewardBalance = rewardPerValidator * stakedPoolIds.length
                    const latestBeaconBalance = await manager.latestBeaconBalance()
                    const formattedBeaconBalance = ethers.utils.formatEther(latestBeaconBalance)
                    const nextBeaconBalance = round(
                        parseFloat(formattedBeaconBalance) 
                        + activatedBalance
                        + rewardBalance
                        - sweptRewardBalance 
                        - sweptExitedBalance,
                        10
                    )
                    const nextActivatedDeposits = (await manager.getPendingPoolIds()).length
                    for (const poolId of lastStakedPoolIds) {
                        const poolAddress = await manager.getPoolAddress(poolId)
                        const currentBalance = await ethers.provider.getBalance(poolAddress)
                        const nextBalance = currentBalance.add(ethers.utils.parseEther(rewardPerValidator.toString()))
                        await setBalance(poolAddress, nextBalance)
                    }
                    const startIndex = ethers.BigNumber.from(0)
                    const endIndex = ethers.BigNumber.from(stakedPoolIds.length)
                    const compoundablePoolIds = await views.getCompoundablePoolIds(startIndex, endIndex)
                    const reportValues = {
                        beaconBalance: nextBeaconBalance,
                        sweptBalance: sweptRewardBalance + sweptExitedBalance,
                        activatedDeposits: nextActivatedDeposits,
                        forcedExits: 0,
                        completedExits: exitingPoolCount.toNumber(),
                        compoundablePoolIds
                    }
                    console.log("🧾 Report values", reportValues)
                    await fulfillReport({
                        donTransmitter,
                        upkeep,
                        functionsBillingRegistry,
                        values: reportValues
                    })
                    if (activatedPoolCount) {
                        await activatePoolsHandler(
                            { manager, views, signer: daoOracle, args: { count: activatedPoolCount } }
                        )
                    }
                    let remaining = exitingPoolCount.toNumber()
                    if (remaining) {
                        for (const poolId of stakedPoolIds) {
                            if (remaining === 0) break
                            const poolConfig = await views.getPoolConfig(poolId)
                            if (poolConfig.status === PoolStatus.EXITING_FORCED 
                                || poolConfig.status === PoolStatus.EXITING_REQUESTED) {
                                remaining--
                                const poolAddress = await manager.getPoolAddress(poolId)
                                const currentBalance = await ethers.provider.getBalance(poolAddress)
                                const poolSweptExitedBalance = sweptExitedBalance / exitingPoolCount.toNumber()
                                const nextBalance = currentBalance
                                    .add(ethers.utils.parseEther(poolSweptExitedBalance.toString()))
                                await setBalance(poolAddress, nextBalance)
                            }
                        }
                        let finalizableCompletedExits = await manager.finalizableCompletedExits()
                        while (finalizableCompletedExits.toNumber() !== exitingPoolCount.toNumber()) {
                            finalizableCompletedExits = await manager.finalizableCompletedExits()
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

dev().catch(error => {
    console.error(error)
    process.exit(1)
})
