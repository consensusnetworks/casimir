import { Config } from "./providers/config"
import { getEventsIterable } from "@casimir/events"
import { getStartBlock, updateErrorLog, updateStartBlock } from "@casimir/logs"
import { fulfillRequestHandler } from "./handlers/fulfill-request"
import { ethers } from "ethers"
import { HandlerInput } from "./interfaces/HandlerInput"
import FunctionsOracleAbi from "@casimir/ethereum/build/abi/FunctionsOracle.json"


async function run() {
    const config = new Config()
    const contracts = {
        FunctionsOracle: {
            abi: FunctionsOracleAbi,
            addresses: [config.functionsOracleAddress],
            events: {
                OracleRequest: fulfillRequestHandler
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
        const args = event.args as ethers.utils.Result
        const handler = handlers[event.event as string]
        if (!handler) throw new Error(`No handler found for event ${event.event}`)
        await handler({ args })
        if (process.env.USE_LOGS === "true" && !config.dryRun) {
            // Todo check if this possibly misses events
            updateStartBlock("block.log", event.blockNumber + 1)
        }
    }
}

run().catch(error => {
    if (process.env.USE_LOGS === "true") {
        updateErrorLog("error.log", (error as Error).message)
    } else {
        console.log(error)
    }
    process.exit(1)
})