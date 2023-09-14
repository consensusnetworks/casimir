import { ethers } from 'ethers'

export function getEventsIterable(input: {
    contractFilters: {
        abi: string[]
        address: string
        events: string[]
    }[]
    ethereumUrl?: string
    provider?: ethers.providers.JsonRpcProvider
    startBlock?: number
}) {
    const provider =
        input.provider || new ethers.providers.JsonRpcProvider(input.ethereumUrl)
    return (async function* () {
        const queue: any[][] = []
        const listener = (...args: any[]) => queue.push(args)
        for (const filter of input.contractFilters) {
            const contract = new ethers.Contract(
                filter.address,
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
                    for (const eventObj of historicalEvents) {
                        queue.push([eventObj])
                    }
                }
            }
            for (const event of filter.events) {
                contract.on(event, listener)
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
    })()
}