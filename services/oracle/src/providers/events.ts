import { ethers } from 'ethers'
import { on, EventEmitter } from 'events'
import { mergeAsyncIterables } from './iterables'

export function getEventEmitter({ manager, events }: { manager: ethers.Contract, events: string[] }) {
    const iterables = []
    for (const event of events) {
        const iterable = getEvent({ manager, event })
        iterables.push(iterable)
    }
    return mergeAsyncIterables(iterables)
}

function getEvent({ manager, event }: { manager: ethers.Contract, event: string }) {
    return on(manager as ethers.Contract & EventEmitter, event)
}