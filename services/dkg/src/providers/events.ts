import { ethers } from 'ethers'
import { on, EventEmitter } from 'events'
import { mergeAsyncIterables } from './iterables'

export async function getEventEmitter({ manager, events }: { manager: ethers.Contract, events: string[] }) {
    const iterables = []
    for (const event of events) {
        const iterable = await getEvent({ manager, event })
        iterables.push(iterable)
    }
    return mergeAsyncIterables(iterables)
}

async function getEvent({ manager, event }: { manager: ethers.Contract, event: string }) {
    const emitter = new EventEmitter()
    await manager.on(event, (...args) => emitter.emit(event, ...args))
    return on(emitter as EventEmitter, event)
}