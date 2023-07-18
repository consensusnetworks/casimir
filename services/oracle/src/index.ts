import { getConfig } from './providers/config'
import { getEventsIterable } from './providers/events'
import { 
    initiateDepositHandler, 
    // initiateResharesHandler, 
    // initiateExitsHandler, 
    // reportForcedExitsHandler,
    reportCompletedExitsHandler
} from './providers/handlers'

void async function () {

    const { manager } = getConfig()

    const handlers = {
        DepositRequested: initiateDepositHandler,
        /**
         * We don't need to handle these/they aren't ready:
         * ResharesRequested: initiateResharesHandler,
         * ExitRequested: initiateExitsHandler,
         * ForcedExitReportsRequested: reportForcedExitsHandler,
         */
        CompletedExitReportsRequested: reportCompletedExitsHandler
    }
    
    const eventsIterable = getEventsIterable({ manager, events: Object.keys(handlers) })

    for await (const event of eventsIterable) {
        const details = event?.[event.length - 1]
        const { args } = details
        const handler = handlers[details.event as keyof typeof handlers]
        if (!handler) throw new Error(`No handler found for event ${details.event}`)
        await handler(args)
    }
}()



