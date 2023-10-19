import { getConfig } from './providers/config'
import { getEventsIterable } from '@casimir/events'
import { getStartBlock, updateErrorLog, updateStartBlock } from '@casimir/logs'
import { fulfillRequestHandler } from './providers/handlers'
import { ethers } from 'ethers'

const config = getConfig()

const contracts = {
    FunctionsOracle: {
        abi: config.functionsOracleAbi,
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
if (process.env.USE_LOGS === 'true') {
    startBlock = getStartBlock('block.log')
}

const eventsIterable = getEventsIterable({
    contractFilters,
    ethereumUrl: config.ethereumUrl,
    startBlock
})

const handlers: Record<string, (input: ethers.utils.Result) => Promise<void>> = {}
for (const contractName in contracts) {
    const contract = contracts[contractName as keyof typeof contracts]
    for (const [event, handler] of Object.entries(contract.events)) {
        handlers[event as keyof typeof handlers] = handler
    }
}

void async function () {
    try {
        for await (const event of eventsIterable) {
            const details = event?.[event.length - 1] as ethers.Event
            const input = details.args as ethers.utils.Result
            const handler = handlers[details.event as string]
            if (!handler) throw new Error(`No handler found for event ${details.event}`)
            await handler(input)
            if (process.env.USE_LOGS === 'true') {
                updateStartBlock('block.log', details.blockNumber)
            }
        }
    } catch (error) {
        if (process.env.USE_LOGS === 'true') {
            updateErrorLog('error.log', (error as Error).message)
        } else {
            console.log(error)
        }
        process.exit(1)
    }
}()