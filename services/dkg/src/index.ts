import { config } from './providers/config'
import { getEventEmitter } from './providers/events'
import { initiatePoolDepositCommand, initiatePoolExitCommand } from './providers/commands'

const { manager, signer, messengerUrl } = config()

const events = [
    'PoolReady',
    'PoolExitRequested'
]

const eventEmitter = getEventEmitter({ manager, events })

;(async function () {
    for await (const event of eventEmitter) {
        const [ id, details ] = event

        if (details.event === 'PoolReady') {
            await initiatePoolDepositCommand({ manager, signer, messengerUrl })
            console.log(`Pool ${id} deposit initiated at block number ${details.blockNumber}`)
        }

        if (details.event === 'PoolExitRequested') {
            await initiatePoolExitCommand({ manager, messengerUrl, id })
            console.log(`Pool ${id} exit initiated at block number ${details.blockNumber}`)
        }
    }
})()

