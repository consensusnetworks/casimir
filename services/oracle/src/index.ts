import { getConfig } from './providers/config'
import { getEventsIterable } from './providers/events'
import {
    depositFunctionsBalanceHandler,
    depositUpkeepBalanceHandler,
    initiateDepositHandler,
    reportResharesHandler, 
    // initiateExitsHandler, 
    // reportForcedExitsHandler,
    reportCompletedExitsHandler
} from './providers/handlers'

const config = getConfig()
const handlers = {
    DepositRequested: initiateDepositHandler,
    ResharesRequested: reportResharesHandler,
    /**
     * We don't need to handle these/they aren't ready:
     * ExitRequested: initiateExitsHandler,
     * ForcedExitReportsRequested: reportForcedExitsHandler,
     */
    CompletedExitReportsRequested: reportCompletedExitsHandler
}

void async function () {
    const eventsIterable = getEventsIterable({
        ethereumUrl: config.ethereumUrl,
        managerAddress: config.managerAddress,
        events: Object.keys(handlers)
    })

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





