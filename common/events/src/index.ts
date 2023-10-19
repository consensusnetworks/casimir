import { ethers } from 'ethers'

export function getEventsIterable(input: {
    contractFilters: {
        abi: string[]
        addresses: string[]
        events: string[]
    }[]
    ethereumUrl?: string
    provider?: ethers.providers.JsonRpcProvider
    startBlock?: number
}) {
    const provider =
        input.provider || new ethers.providers.JsonRpcProvider(input.ethereumUrl)
    return (async function* () {
        const queue: ethers.Event[][] = []
        const enqueue = (...args: ethers.Event[]) => queue.push(args)
        for (const filter of input.contractFilters) {
            for (const address of filter.addresses) {
                const contract = new ethers.Contract(
                    address,
                    filter.abi,
                    provider
                ) as ethers.Contract
                if (input.startBlock !== undefined) {
                    for (const event of filter.events) {
                        const historicalEvents = await contract.queryFilter(
                            event,
                            input.startBlock,
                            'latest'
                        )
                        for (const historicalEvent of historicalEvents) {
                            enqueue(historicalEvent)
                        }
                    }
                }
                for (const event of filter.events) {
                    contract.on(event, enqueue)
                    while (true) {
                        if (queue.length === 0) {
                            await new Promise<void>((resolve) => {
                                const waitListener = () => {
                                    contract.off(event, waitListener)
                                    resolve()
                                }
                                contract.on(event, waitListener)
                            })
                        } else {
                            yield queue.shift()
                        }
                    }
                }
            }
        }
    })()
}
