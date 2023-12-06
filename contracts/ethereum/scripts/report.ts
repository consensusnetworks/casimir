import { ethers } from "hardhat"
import { CasimirFactory, CasimirManager, CasimirUpkeep } from "../build/@types"
import { waitForNetwork } from "../helpers/network"

void async function() {
    if (!process.env.FACTORY_ADDRESS) throw new Error("No factory address provided")

    await waitForNetwork(ethers.provider)

    const [owner] = await ethers.getSigners()
    const factory = await ethers.getContractAt("CasimirFactory", process.env.FACTORY_ADDRESS) as CasimirFactory
    const [managerId] = await factory.getManagerIds()
    const managerConfig = await factory.getManagerConfig(managerId)
    const manager = await ethers.getContractAt("CasimirManager", managerConfig.managerAddress) as CasimirManager
    const upkeep = await ethers.getContractAt("CasimirUpkeep", managerConfig.upkeepAddress) as CasimirUpkeep

    const requestReport = await upkeep.connect(owner).requestReport()
    await requestReport.wait()

    // const unpause = await manager.connect(owner).setPaused(true)
    // await unpause.wait()
}()