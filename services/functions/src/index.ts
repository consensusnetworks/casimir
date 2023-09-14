import { getConfig } from './providers/config'
import { getEventsIterable } from '@casimir/events'
import { getStartBlock, updateErrorLog, updateStartBlock } from '@casimir/logs'
import { fulfillRequestHandler } from './providers/handlers'
import { HandlerInput } from './interfaces/HandlerInput'

const config = getConfig()

const contracts = {
    FunctionsOracle: {
        abi: config.functionsOracleAbi,
        address: config.functionsOracleAddress,
        events: {
            OracleRequest: fulfillRequestHandler
        }
    }
}

const contractFilters = Object.values(contracts).map((contract) => {
    return {
        abi: contract.abi,
        address: contract.address,
        events: Object.keys(contract.events)
    }
})

let startBlock
if (process.env.USE_LOGS === 'true') {
    startBlock = getStartBlock('.log/block.log')
}

const eventsIterable = getEventsIterable({
    contractFilters,
    ethereumUrl: config.ethereumUrl,
    startBlock
})

const handlers: Record<string, (input: HandlerInput) => Promise<void>> = {}
for (const contractName in contracts) {
    const contract = contracts[contractName as keyof typeof contracts]
    for (const [event, handler] of Object.entries(contract.events)) {
        handlers[event as keyof typeof handlers] = handler
    }
}

void async function () {
    try {
        for await (const event of eventsIterable) {
            const details = event?.[event.length - 1]
            const { args } = details
            const handler = handlers[details.event]
            if (!handler) throw new Error(`No handler found for event ${details.event}`)
            await handler({ args })
            if (process.env.USE_LOGS === 'true') {
                updateStartBlock('.log/block.log', details.blockNumber)
            }
        }
    } catch (error) {
        if (process.env.USE_LOGS === 'true') {
            updateErrorLog('.log/error.log', (error as Error).message)
        } else {
            console.log(error)
        }
        process.exit(1)
    }
}()