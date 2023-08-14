import { ethers } from 'ethers'
import { CasimirManager } from '@casimir/ethereum/build/@types'
import ICasimirManagerAbi from '@casimir/ethereum/build/abi/ICasimirManager.json'
import { GetEventsIterableInput } from '../interfaces/GetEventsIterableInput'

export function getEventsIterable(input: GetEventsIterableInput) {
    const events = input.events
    let provider: ethers.providers.JsonRpcProvider
    if (input.provider) {
        provider = input.provider
    } else {
        provider = new ethers.providers.JsonRpcProvider(input.ethereumUrl)
    }
    const manager = new ethers.Contract(input.managerAddress, ICasimirManagerAbi, provider) as ethers.Contract & CasimirManager
    
    return (async function*() {
        for (const event of events) {
            const queue: any[][] = []
            const listener = (...args: any[]) => queue.push(args)
            manager.on(event, listener)
            while (true) {
                if (queue.length === 0) {
                    await new Promise<void>(resolve => {
                        const waitListener = () => {
                            manager.off(event, waitListener)
                            resolve()
                        }
                        manager.on(event, waitListener)
                    })
                } else {
                    yield queue.shift()
                }
            }
        }
    })()
}