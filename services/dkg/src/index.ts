import { config } from './providers/config'
import { getEventEmitter } from './providers/events'
import { initiatePoolDepositHandler, initiatePoolExitHandler, initiatePoolReshareHandler } from './providers/handlers'

const handlers = {
    PoolDepositRequested: initiatePoolDepositHandler,
    PoolReshareRequested: initiatePoolReshareHandler,
    PoolExitRequested: initiatePoolExitHandler
}

;(async function () {
    const { manager, ssv, provider, signer, cliPath, messengerUrl } = await config()

    const eventEmitter = await getEventEmitter({ manager, events: Object.keys(handlers) })
    for await (const event of eventEmitter) {
        const [ id, details ] = event
        const { filter } = details

        console.log(`Event ${filter} received for pool ${Number(id)}`)

        const handler = handlers[filter as keyof typeof handlers]
        if (!handler) throw new Error(`No handler found for event ${filter}`)
        await handler({ manager, ssv, provider, signer, cliPath, messengerUrl, id: Number(id) })
    }
})()

