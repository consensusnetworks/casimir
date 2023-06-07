import { config } from './providers/config'
import { getEventsIterable } from './providers/events'
import { 
    initiateDepositHandler, 
    initiatePoolExitHandler, 
    initiatePoolReshareHandler, 
    reportCompletedExitsHandler 
} from './providers/handlers'

const handlers = {
    DepositRequested: initiateDepositHandler,
    ReshareRequested: initiatePoolReshareHandler,
    ExitRequested: initiatePoolExitHandler,
    // ForcedExitReportsRequested: reportForcedExitssHandler,
    CompletedExitReportsRequested: reportCompletedExitsHandler
}

const { provider, signer, manager, cliPath, messengerUrl } = config()

;(async function () {
    const eventsIterable = getEventsIterable({ manager, events: Object.keys(handlers) })
    
    console.log('Listening for events', eventsIterable)

    for await (const event of eventsIterable) {
        const details = event?.[event.length - 1]
        const { args } = details
        const handler = handlers[details.event as keyof typeof handlers]
        if (!handler) throw new Error(`No handler found for event ${details.event}`)
        await handler({ 
            provider,
            signer,
            manager,
            cliPath,
            messengerUrl,
            args 
        })
    }
})()


