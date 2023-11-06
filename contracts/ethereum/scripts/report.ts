import { ethers } from "hardhat"
import { CasimirFactory, CasimirManager, CasimirPool, CasimirRegistry, CasimirUpkeep, CasimirViews } from "../build/@types"
import { waitForNetwork } from "../helpers/network"
import { runUpkeep } from "../helpers/upkeep"
import e from "cors"

void async function() {
  if (!process.env.FACTORY_ADDRESS) throw new Error("No factory address provided")

  await waitForNetwork(ethers.provider)

  const [owner, , donTransmitter] = await ethers.getSigners()
  const factory = await ethers.getContractAt("CasimirFactory", process.env.FACTORY_ADDRESS) as CasimirFactory
  const [managerId] = await factory.getManagerIds()
  const managerConfig = await factory.getManagerConfig(managerId)
  const manager = await ethers.getContractAt("CasimirManager", managerConfig.managerAddress) as CasimirManager
  const registry = await ethers.getContractAt("CasimirRegistry", managerConfig.registryAddress) as CasimirRegistry
  const upkeep = await ethers.getContractAt("CasimirUpkeep", managerConfig.upkeepAddress) as CasimirUpkeep
  const views = await ethers.getContractAt("CasimirViews", managerConfig.viewsAddress) as CasimirViews

  // const pause = await manager.connect(owner).setPaused(false)
  // await pause.wait()
  const requestReport = await upkeep.connect(owner).requestReport()
  await requestReport.wait()

  if (process.env.SIMULATE_UPKEEP === "true") {
    await runUpkeep({ donTransmitter, upkeep })
    let finalizedReport = false
    while (!finalizedReport) {
      finalizedReport = await runUpkeep({ donTransmitter, upkeep })
      await new Promise(resolve => setTimeout(resolve, 2500))
    }
    const poolIds = await manager.getStakedPoolIds()
    const sweptBalance = await views.getSweptBalance(0, poolIds.length)
    console.log("Swept balance", ethers.utils.formatEther(sweptBalance))
    let totalBalance = ethers.BigNumber.from(0)
    for (const poolId of poolIds) {
      const poolAddress = await manager.getPoolAddress(poolId)
      const poolBalance = await ethers.provider.getBalance(poolAddress)
      totalBalance = totalBalance.add(poolBalance)
      console.log("Pool", poolId, ethers.utils.formatEther(poolBalance))
    }
    console.log("Total balance", ethers.utils.formatEther(totalBalance))
  }
}()