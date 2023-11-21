import { ethers } from "ethers"

export function getEventsIterable(input: {
    contractFilters: {
        abi: string[];
        addresses: string[];
        events: string[];
    }[];
    ethereumUrl?: string;
    provider?: ethers.providers.JsonRpcProvider;
    startBlock?: number;
}) {
    const provider = input.provider || new ethers.providers.JsonRpcProvider(input.ethereumUrl)
    return (async function* () {
        const queue: ethers.Event[] = []
        const enqueueEvent = (...args: ethers.Event[]) => {
            const e = args[args.length - 1] as ethers.Event
            queue.push(e)
        }
        const latestBlock = await provider.getBlockNumber()
        for (const filter of input.contractFilters) {
            for (const address of filter.addresses) {
                for (const event of filter.events) {
                    const contract = new ethers.Contract(address, filter.abi, provider) as ethers.Contract
                    const tempQueue: ethers.Event[] = []
                    const tempListener = (...args: ethers.Event[]) => {
                        const e = args[args.length - 1] as ethers.Event
                        if (e.blockNumber > latestBlock) {
                            tempQueue.push(e)
                        }
                    }
                    contract.on(event, tempListener)
                    if (input.startBlock) {
                        const historicalEvents = await contract.queryFilter(event, input.startBlock, latestBlock)
                        for (const historicalEvent of historicalEvents) {
                            enqueueEvent(historicalEvent)
                        }
                    }
                    contract.off(event, tempListener)                
                    while (tempQueue.length) {
                        const nextTempEvent = tempQueue.shift()
                        if (nextTempEvent) {
                            enqueueEvent(nextTempEvent)
                        }
                    }                
                    contract.on(event, enqueueEvent)
                }
            }
        }
        while (true) {
            if (queue.length > 0) {
                const nextEvent = queue.shift()
                if (nextEvent) {
                    yield nextEvent
                }
            } else {
                await new Promise((resolve) => setTimeout(resolve, 1000))
            }
        }
    })()
}
