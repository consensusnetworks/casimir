import { config } from './providers/config'
import { getEventEmitter } from './providers/events'
import { initiatePoolDepositCommand, initiatePoolExitCommand, initiatePoolReshareCommand } from './providers/commands'

const { manager, signer, cliPath, messengerUrl } = config()

const commands = {
    PoolDepositRequested: initiatePoolDepositCommand,
    PoolReshareRequested: initiatePoolReshareCommand,
    PoolExitRequested: initiatePoolExitCommand
}

const eventEmitter = getEventEmitter({ manager, events: Object.keys(commands) })

;(async function () {
    for await (const event of eventEmitter) {
        const [ id, details ] = event

        const command = commands[details.event as keyof typeof commands]
        if (!command) throw new Error(`No command found for event ${details.event}`)

        console.log(`Executing ${details.event} command for pool ${id}`)
        await command({ manager, signer, cliPath, messengerUrl, id })
    }
})()

