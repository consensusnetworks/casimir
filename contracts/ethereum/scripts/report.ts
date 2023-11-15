import { ethers } from "hardhat"
import { CasimirFactory, CasimirManager, CasimirRegistry, CasimirUpkeep, CasimirViews, FunctionsBillingRegistry } from "../build/@types"
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
	const manager = await ethers.getContractAt("CasimirManager", managerConfig.managerAddress) as CasimirManager
	const registry = await ethers.getContractAt("CasimirRegistry", managerConfig.registryAddress) as CasimirRegistry
	const upkeep = await ethers.getContractAt("CasimirUpkeep", managerConfig.upkeepAddress) as CasimirUpkeep
	const views = await ethers.getContractAt("CasimirViews", managerConfig.viewsAddress) as CasimirViews
	const functionsBillingRegistry = await ethers.getContractAt("FunctionsBillingRegistry", process.env.FUNCTIONS_BILLING_REGISTRY_ADDRESS) as FunctionsBillingRegistry

	let validatorDeposited = false
	while (!validatorDeposited) {
		// 0x853b4caf348bccddbf7e1c25e68676c3b3f857958c93b290a2bf84974ea33c4f793f1bbf7e9e9923f16e2237038e7b69
		// 0xa2a641b314a505a0cc0c75096cae3f2895db4ced87fe96c781677bbea1b9b60348799100965cbda987219ef1477b2152
		const response = await fetch("https://consensus:Network31968@nodes.casimir.co/eth/goerli/eth/v1/beacon/states/finalized/validators?id=0xa2a641b314a505a0cc0c75096cae3f2895db4ced87fe96c781677bbea1b9b60348799100965cbda987219ef1477b2152")
		const validators = await response.json()
		if (validators.data.length) {
			const { status } = validators.data[0]
			if (status.includes("active")) {
				console.log("Validator is active")
				validatorDeposited = true
			} else {
				console.log("Waiting for validator to be active")
				await new Promise(resolve => setTimeout(resolve, 60000))
			}
		} else {
			console.log("Waiting for validator to be active")
			await new Promise(resolve => setTimeout(resolve, 60000))
		}
	}
    
	// const pause = await manager.connect(owner).setPaused(false)
	// await pause.wait()
    
	const requestReport = await upkeep.connect(owner).requestReport()
	await requestReport.wait()
	await runUpkeep({ donTransmitter, upkeep })

	// if (process.env.SIMULATE_UPKEEP === "true") {
	//     await runUpkeep({ donTransmitter, upkeep })
	//     let finalizedReport = false
	//     while (!finalizedReport) {
	//         finalizedReport = await runUpkeep({ donTransmitter, upkeep })
	//         await new Promise(resolve => setTimeout(resolve, 2500))
	//     }
	//     const poolIds = await manager.getStakedPoolIds()
	//     const sweptBalance = await views.getSweptBalance(0, poolIds.length)
	//     console.log("Swept balance", ethers.utils.formatEther(sweptBalance))
	//     let totalBalance = ethers.BigNumber.from(0)
	//     for (const poolId of poolIds) {
	//         const poolAddress = await manager.getPoolAddress(poolId)
	//         const poolBalance = await ethers.provider.getBalance(poolAddress)
	//         totalBalance = totalBalance.add(poolBalance)
	//         console.log("Pool", poolId, ethers.utils.formatEther(poolBalance))
	//     }
	//     console.log("Total balance", ethers.utils.formatEther(totalBalance))
	// }
}()