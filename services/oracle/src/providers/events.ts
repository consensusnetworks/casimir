import { ethers } from 'ethers'
import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import CasimirManagerJson from '@casimir/ethereum/build/artifacts/src/v1/CasimirManager.sol/CasimirManager.json'

export function getEventsIterable({ ethereumUrl, managerAddress, events }: { 
    ethereumUrl: string, 
    managerAddress: string, 
    events: string[] 
}) {
    const provider = new ethers.providers.JsonRpcProvider(ethereumUrl)
    const manager = new ethers.Contract(managerAddress, CasimirManagerJson.abi, provider) as ethers.Contract & CasimirManager
    
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