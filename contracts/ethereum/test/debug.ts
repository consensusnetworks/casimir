// import { expect } from 'chai'
import fs from "fs"
import { ethers, upgrades } from "hardhat"
import { ETHEREUM_CONTRACTS } from "@casimir/env"
import CasimirFactoryAbi from "../build/abi/CasimirFactory.json"
import ICasimirManagerDevAbi from "../build/abi/ICasimirManagerDev.json"
import ICasimirRegistryAbi from "../build/abi/ICasimirRegistry.json"
import ICasimirUpkeepDevAbi from "../build/abi/ICasimirUpkeepDev.json"
import ICasimirViewsAbi from "../build/abi/ICasimirViews.json"
import { CasimirManagerDev, CasimirRegistry, CasimirUpkeepDev, CasimirViews } from "../build/@types"

describe("Upgrades", async function () {
    it("Check values with dev", async function () {
        if (process.env.DEBUG) {
            const debugBlockNumber = 
            process.env.ETHEREUM_FORK_BLOCK ? 
                parseInt(process.env.ETHEREUM_FORK_BLOCK)
                : await ethers.provider.getBlockNumber()
            const networkKey = (process.env.NETWORK?.toUpperCase() || "TESTNET") as keyof typeof ETHEREUM_CONTRACTS
            const factory = new ethers.Contract(
                ETHEREUM_CONTRACTS[networkKey].FACTORY_ADDRESS, CasimirFactoryAbi, ethers.provider
            )
            const [managerId] = await factory.getManagerIds()
            const managerConfig = await factory.getManagerConfig(managerId)
        
            const managerDevFactory = await ethers.getContractFactory("CasimirManagerDev", {
                libraries: {
                    CasimirBeacon: ETHEREUM_CONTRACTS[networkKey].BEACON_LIBRARY_ADDRESS
                }
            })
            const managerBeacon = await upgrades
                .upgradeBeacon(ETHEREUM_CONTRACTS[networkKey]
                    .MANAGER_BEACON_ADDRESS, managerDevFactory, {
                    constructorArgs: [
                        ETHEREUM_CONTRACTS[networkKey].FUNCTIONS_BILLING_REGISTRY_ADDRESS,
                        ETHEREUM_CONTRACTS[networkKey].KEEPER_REGISTRAR_ADDRESS,
                        ETHEREUM_CONTRACTS[networkKey].KEEPER_REGISTRY_ADDRESS,
                        ETHEREUM_CONTRACTS[networkKey].LINK_TOKEN_ADDRESS,
                        ETHEREUM_CONTRACTS[networkKey].SSV_NETWORK_ADDRESS,
                        ETHEREUM_CONTRACTS[networkKey].SSV_TOKEN_ADDRESS,
                        ETHEREUM_CONTRACTS[networkKey].SWAP_FACTORY_ADDRESS,
                        ETHEREUM_CONTRACTS[networkKey].SWAP_ROUTER_ADDRESS,
                        ETHEREUM_CONTRACTS[networkKey].WETH_TOKEN_ADDRESS
                    ],
                    unsafeAllow: ["external-library-linking"]
                })
            await managerBeacon.deployed()
            const manager = new ethers.Contract(
                managerConfig.managerAddress, ICasimirManagerDevAbi, ethers.provider
            ) as CasimirManagerDev
            console.log(`CasimirManager beacon upgraded at ${manager.address}`)
        
            const registry = new ethers.Contract(
                managerConfig.registryAddress, ICasimirRegistryAbi, ethers.provider
            ) as CasimirRegistry

            const upkeepDevFactory = await ethers.getContractFactory("CasimirUpkeepDev")
            const upkeepBeacon = await upgrades.upgradeBeacon(ETHEREUM_CONTRACTS["TESTNET"].UPKEEP_BEACON_ADDRESS, upkeepDevFactory)
            await upkeepBeacon.deployed()
            const upkeep = new ethers.Contract(
                managerConfig.upkeepAddress, ICasimirUpkeepDevAbi, ethers.provider
            ) as CasimirUpkeepDev
            console.log(`CasimirUpkeep beacon upgraded at ${upkeep.address}`)

            const views = new ethers.Contract(
                managerConfig.viewsAddress, ICasimirViewsAbi, ethers.provider
            ) as CasimirViews

            const latestActiveRewardBalance = await manager.getLatestActiveRewardBalance()
            const latestBeaconBalance = await manager.latestBeaconBalance()
            const stakeRatioSum = await manager.getStakeRatioSum()
            const totalStake = await manager.getTotalStake()
            const deposits = await manager.queryFilter(manager.filters.StakeDeposited(), 0, debugBlockNumber)
            const userAddresses = deposits
                .map(deposit => deposit.args?.sender).filter((value, index, self) => self.indexOf(value) === index)
            const userStakes: Record<string, string> = {}
            for (const userAddress of userAddresses) {
                const userStake = await manager.getUserStake(userAddress)
                userStakes[userAddress] = ethers.utils.formatEther(userStake)
            }

            // const depositedPoolCount = await views.getDepositedPoolCount()
            // const compoundablePoolIds = await views.getCompoundablePoolIds(0, depositedPoolCount)
            // const sweptBalance = await views.getSweptBalance(0, depositedPoolCount)

            const dust = totalStake.sub(Object.values(userStakes).reduce((acc, curr) => {
                return acc.add(ethers.utils.parseEther(curr))
            }, ethers.utils.parseEther("0")))
            const values = {
                // compoundablePoolIds,
                dust: ethers.utils.formatEther(dust),
                latestActiveRewardBalance: ethers.utils.formatEther(latestActiveRewardBalance),
                latestBeaconBalance: ethers.utils.formatEther(latestBeaconBalance),
                stakeRatioSum: ethers.utils.formatEther(stakeRatioSum),
                // sweptBalance: ethers.utils.formatEther(sweptBalance),
                totalStake: ethers.utils.formatEther(totalStake),
                userStakes
            }
            const debugBlock = { 
                block: debugBlockNumber,
                values 
            }
            const debugBlocksDir = "debug"
            const debugBlocksFile = "blocks.json"
            const debugBlocksPath = `${debugBlocksDir}/${debugBlocksFile}`
            if (!fs.existsSync(debugBlocksDir)) {
                fs.mkdirSync(debugBlocksDir, { recursive: true })
            }
            let existingDebugBlocks: typeof debugBlock[]
            try {
                existingDebugBlocks = JSON.parse(fs.readFileSync(debugBlocksPath).toString())
            } catch (e) {
                existingDebugBlocks = []
            }
            existingDebugBlocks.push(debugBlock)
            fs.writeFileSync(debugBlocksPath, JSON.stringify(existingDebugBlocks, null, 4))
        }
    })
})