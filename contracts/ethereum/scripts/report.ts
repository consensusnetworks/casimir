import { ethers } from "hardhat"
import { CasimirFactory, CasimirUpkeep } from "../build/@types"
import { waitForNetwork } from "../helpers/network"
import { runUpkeep } from "../helpers/upkeep"

void async function() {
    if (!process.env.FACTORY_ADDRESS) throw new Error("No factory address provided")
    if (!process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS) throw new Error("No functions billing registry address provided")

    await waitForNetwork(ethers.provider)

    const [owner, , donTransmitter] = await ethers.getSigners()
    const factory = await ethers.getContractAt("CasimirFactory", process.env.FACTORY_ADDRESS) as CasimirFactory
    const [managerId] = await factory.getManagerIds()
    const managerConfig = await factory.getManagerConfig(managerId)
    const upkeep = await ethers.getContractAt("CasimirUpkeep", managerConfig.upkeepAddress) as CasimirUpkeep
    
    const requestReport = await upkeep.connect(owner).requestReport()
    await requestReport.wait()

    if (!process.env.NETWORK) {
        await runUpkeep({ donTransmitter, upkeep })
    }
}()