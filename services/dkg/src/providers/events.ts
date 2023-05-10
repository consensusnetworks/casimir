import { ethers } from 'ethers'
import { on, EventEmitter } from 'events'
import { mergeAsyncIterables } from './iterables'

export function getEventEmitter({ manager, events }: { manager: ethers.Contract, events: string[] }) {
    return mergeAsyncIterables(events.map(event => getEvent({ manager, event })))
}

function getEvent({ manager, event }: { manager: ethers.Contract, event: string }) {
    return on(manager as unknown as EventEmitter, event)
}