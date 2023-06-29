import { config } from './providers/config'
import { getEventsIterable } from './providers/events'
import { 
    initiateDepositHandler, 
    // initiateResharesHandler, 
    // initiateExitsHandler, 
    // reportForcedExitsHandler,
    reportCompletedExitsHandler
} from './providers/handlers'

void async function () {
    console.log('STARTING ORACLE')

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

    console.log('GOT HANDLERS', handlers)
    
    const { 
        provider,
        signer,
        manager,
        views,
        linkTokenAddress,
        ssvTokenAddress,
        wethTokenAddress,
        cliPath,
        messengerUrl
    } = config()

    console.log('GOT CONFIG', config)
    
    const eventsIterable = getEventsIterable({ manager, events: Object.keys(handlers) })

    console.log('GOT EVENTS ITERABLE', eventsIterable)

    for await (const event of eventsIterable) {
        const details = event?.[event.length - 1]
        const { args } = details
        const handler = handlers[details.event as keyof typeof handlers]
        if (!handler) throw new Error(`No handler found for event ${details.event}`)
        await handler({ 
            provider,
            signer,
            manager,
            views,
            linkTokenAddress,
            ssvTokenAddress,
            wethTokenAddress,
            cliPath,
            messengerUrl,
            args 
        })
    }
}()



