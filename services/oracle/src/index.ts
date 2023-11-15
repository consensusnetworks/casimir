import { ethers } from "ethers"
import { getEventsIterable } from "@casimir/events"
import { getStartBlock, updateErrorLog, updateStartBlock } from "@casimir/logs"
import ICasimirFactoryAbi from "@casimir/ethereum/build/abi/ICasimirFactory.json"
import ICasimirManagerAbi from "@casimir/ethereum/build/abi/ICasimirManager.json"
import ICasimirRegistryAbi from "@casimir/ethereum/build/abi/ICasimirRegistry.json"
import ICasimirUpkeepAbi from "@casimir/ethereum/build/abi/ICasimirUpkeep.json"
import { ICasimirFactory } from "@casimir/ethereum/build/@types"
import { HandlerInput } from "./interfaces/HandlerInput"
import { getConfig } from "./providers/config"
import {
    depositFunctionsBalanceHandler,
    depositUpkeepBalanceHandler,
    initiatePoolHandler,
    activatePoolsHandler,
    resharePoolsHandler,
    // exitPoolHandler, 
    // reportForcedExitsHandler,
    reportCompletedExitsHandler
} from "./providers/handlers"

const config = getConfig()

void async function () {
    try {
        const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
        const factory = new ethers.Contract(config.factoryAddress, ICasimirFactoryAbi, provider) as ICasimirFactory
        const managerConfigs = await Promise.all((await factory.getManagerIds()).map(async (id) => {
            return await factory.getManagerConfig(id)
        }))

        const contracts = {
            CasimirManager: {
                abi: ICasimirManagerAbi,
                addresses: managerConfigs.map(({ managerAddress }) => managerAddress),
                events: {
                    InitiationRequested: initiatePoolHandler
                    // ExitRequested: exitPoolHandler
                }
            },
            CasimirRegistry: {
                abi: ICasimirRegistryAbi,
                addresses: managerConfigs.map(({ registryAddress }) => registryAddress),
                events: {
                    DeactivationRequested: resharePoolsHandler
                }
            },
            CasimirUpkeep: {
                abi: ICasimirUpkeepAbi,
                addresses: managerConfigs.map(({ upkeepAddress }) => upkeepAddress),
                events: {
                    ActivationsRequested: activatePoolsHandler,
                    // ForcedExitReportsRequested: reportForcedExitsHandler,
                    CompletedExitReportsRequested: reportCompletedExitsHandler
                }
            }
        }

        const contractFilters = Object.values(contracts).map((contract) => {
            return {
                abi: contract.abi,
                addresses: contract.addresses,
                events: Object.keys(contract.events)
            }
        })

        let startBlock
        if (process.env.USE_LOGS === "true") {
            startBlock = getStartBlock("block.log")
        }

        const eventsIterable = getEventsIterable({
            contractFilters,
            ethereumUrl: config.ethereumUrl,
            startBlock
        })

        const handlers: Record<string, (input: HandlerInput) => Promise<void>> = {}
        for (const contract of Object.values(contracts)) {
            for (const [event, handler] of Object.entries(contract.events)) {
                handlers[event as keyof typeof handlers] = handler
            }
        }

        for await (const event of eventsIterable) {
            console.log(`Received ${event.event} event from ${event.address}`)
            const managerConfig = managerConfigs.find(({ managerAddress, registryAddress, upkeepAddress }) => {
                return [managerAddress,
                    registryAddress,
                    upkeepAddress].includes(event.address)
            })
            if (!managerConfig) throw new Error(`No manager config found for address ${event.address}`)
            const args = event.args as ethers.utils.Result
            const handler = handlers[event.event as keyof typeof handlers]
            if (!handler) throw new Error(`No handler found for event ${event.event}`)
            await depositFunctionsBalanceHandler({ managerConfig })
            await depositUpkeepBalanceHandler({ managerConfig })
            await handler({ managerConfig, args })
            if (process.env.USE_LOGS === "true") {
                // Todo check if this possibly misses events
                updateStartBlock("block.log", event.blockNumber + 1)
            }
        }
    } catch (error) {
        if (process.env.USE_LOGS === "true") {
            updateErrorLog("error.log", (error as Error).message)
        } else {
            console.log(error)
        }
        process.exit(1)
    }
}()





