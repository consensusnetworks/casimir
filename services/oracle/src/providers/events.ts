import { ethers } from 'ethers'

// So the issue seems to be here, but here's what we do know:
// 1. The code below works great in the contracts/ethereum/scripts/dev.ts script
// 2. The code below does not work in the services/oracle/src/index.ts script
// 3. What other differences are there between the two scripts?
// 4. Does the Node version matter?
// 5. Does the Ethers version matter?
// 6. Am I missing a line of code somewhere?
// 7. Is there a better way to debug this?

export function getEventsIterable({ manager, events }: { manager: ethers.Contract, events: string[] }) {
    return (async function*() {
        for (const event of events) {
            yield* getEvent({ manager, event })
        }
    })()
}

async function* getEvent({ manager, event }: { manager: ethers.Contract, event: string }) {
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