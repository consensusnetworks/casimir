import { ethers } from "hardhat"
import { CasimirFactory, CasimirManager, CasimirUpkeep } from "../build/@types"
import { waitForNetwork } from "../helpers/network"
import EthDater from "ethereum-block-by-date"

void async function() {
    if (!process.env.FACTORY_ADDRESS) throw new Error("No factory address provided")

    await waitForNetwork(ethers.provider)

    const ethDater = new EthDater(ethers.provider)
    const [owner] = await ethers.getSigners()
    const factory = await ethers.getContractAt("CasimirFactory", process.env.FACTORY_ADDRESS) as CasimirFactory
    const [managerId] = await factory.getManagerIds()
    const managerConfig = await factory.getManagerConfig(managerId)
    const manager = await ethers.getContractAt("CasimirManager", managerConfig.managerAddress) as CasimirManager
    const upkeep = await ethers.getContractAt("CasimirUpkeep", managerConfig.upkeepAddress) as CasimirUpkeep

    const resetReportPeriod = await manager.reportPeriod() - 1
    const resetReportRequestSent = (await upkeep.queryFilter(upkeep.filters.ReportRequestSent())).slice(-4, -3)[0]
    const resetReportRequestArgs = resetReportRequestSent?.args?.requestArgs as string[]

    const resetPreviousReportTimestamp = parseInt(resetReportRequestArgs[7])
    const resetPreviousReportBlock = await ethDater.getDate(resetPreviousReportTimestamp * 1000)
    const resetPreviousReportBlockNumber = resetPreviousReportBlock.block
    const resetReportTimestamp = parseInt(resetReportRequestArgs[8])
    const resetReportBlock = await ethDater.getDate(resetReportTimestamp * 1000)
    const resetReportBlockNumber = resetReportBlock.block

    const resetReport = await upkeep.connect(owner).resetReport(
        resetReportPeriod,
        resetReportBlockNumber,
        resetReportTimestamp,
        resetPreviousReportBlockNumber,
        resetPreviousReportTimestamp
    )
    await resetReport.wait()

    const requestReport = await upkeep.connect(owner).requestReport()
    await requestReport.wait()
}()