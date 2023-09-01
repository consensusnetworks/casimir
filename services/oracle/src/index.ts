import { getConfig } from './providers/config'
import { getEventsIterable } from '@casimir/events'
import {
    depositFunctionsBalanceHandler,
    depositUpkeepBalanceHandler,
    initiateDepositHandler,
    initiateResharesHandler, 
    // initiateExitsHandler, 
    // reportForcedExitsHandler,
    reportCompletedExitsHandler
} from './providers/handlers'
import { HandlerInput } from './interfaces/HandlerInput'

const config = getConfig()

const contracts = {
    CasimirManager: {
        abi: config.managerAbi,
        address: config.managerAddress,
        events: {
            DepositRequested: initiateDepositHandler,
            ResharesRequested: initiateResharesHandler,
            // ExitRequested: initiateExitsHandler,
            // ForcedExitReportsRequested: reportForcedExitsHandler,
            CompletedExitReportsRequested: reportCompletedExitsHandler
            
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

const eventsIterable = getEventsIterable({
    contractFilters,
    ethereumUrl: config.ethereumUrl
})

const handlers: Record<string, (input: HandlerInput) => Promise<void>> = {}
for (const contractName in contracts) {
    const contract = contracts[contractName as keyof typeof contracts]
    for (const [eventName, eventHandler] of Object.entries(contract.events)) {
        handlers[eventName as keyof typeof handlers] = eventHandler
    }
}

void async function () {
    for await (const event of eventsIterable) {
        const details = event?.[event.length - 1]
        const { args } = details
        const handler = handlers[details.event as keyof typeof handlers]
        if (!handler) throw new Error(`No handler found for event ${details.event}`)
        await depositFunctionsBalanceHandler()
        await depositUpkeepBalanceHandler()
        await handler({ args })
    }
}()





