console.log('STARTING')
import { ethers } from 'ethers'
console.log('ETHERS', JSON.stringify(ethers, null, 4))
import { getConfig } from './providers/config'
console.log('GETCONFIG', JSON.stringify(getConfig, null, 4))
import { getEventsIterable } from './providers/events'
console.log('GETEVENTSITERABLE', JSON.stringify(getEventsIterable, null, 4))
import {
    initiateDepositHandler,
    // initiateResharesHandler, 
    // initiateExitsHandler, 
    // reportForcedExitsHandler,
    reportCompletedExitsHandler
} from './providers/handlers'
console.log('INITIATEDEPOSITHANDLER', JSON.stringify(initiateDepositHandler, null, 4))
console.log('REPORTCOMPLETEDEXITSHANDLER', JSON.stringify(reportCompletedExitsHandler, null, 4))

const config = getConfig()
console.log('CONFIG', JSON.stringify(config, null, 4))

void async function () {
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
    console.log('HANDLERS', JSON.stringify(handlers, null, 4))
    const provider = new ethers.providers.JsonRpcProvider(config.ethereumUrl)
    console.log('PROVIDER', JSON.stringify(provider, null, 4))

    const eventsIterable = getEventsIterable({
        ethereumUrl: config.ethereumUrl,
        manager: config.manager,
        events: Object.keys(handlers)
    })

    for await (const event of eventsIterable) {
        console.log('EVENT', JSON.stringify(event, null, 4))
        const details = event?.[event.length - 1]
        const { args } = details
        console.log(`Handling ${details.event} with args ${JSON.stringify(args)}`)
        const handler = handlers[details.event as keyof typeof handlers]
        if (!handler) throw new Error(`No handler found for event ${details.event}`)
        await handler({ args, strategy: config.strategy })
    }
}()



