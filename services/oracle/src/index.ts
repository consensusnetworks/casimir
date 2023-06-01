import { config } from './providers/config'
import { getEventEmitter } from './providers/events'
import { initiatePoolDepositHandler, initiatePoolExitHandler, initiatePoolReshareHandler } from './providers/handlers'

const handlers = {
    DepositRequested: initiatePoolDepositHandler,
    ReshareRequested: initiatePoolReshareHandler,
    PoolExitRequested: initiatePoolExitHandler,
    // UnexpectedExitReportsRequested: reportUnexpectedExitsHandler,
    // SlashedExitReportsRequested: reportSlashedExitsHandler,
    // WithdrawnExitReportsRequested: reportWithdrawnExitsHandler
}

const { provider, signer, manager, cliPath, messengerUrl } = config()

;(async function () {
    const eventEmitter = getEventEmitter({ manager, events: Object.keys(handlers) })    
    for await (const event of eventEmitter) {    
        const [ value, details ] = event
        const handler = handlers[details.event as keyof typeof handlers]
        if (!handler) throw new Error(`No handler found for event ${details.event}`)
        await handler({ 
            provider,
            signer,
            manager,
            cliPath,
            messengerUrl,
            value 
        })
    }
})()

