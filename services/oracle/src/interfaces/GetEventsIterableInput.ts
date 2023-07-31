import { ethers } from 'ethers'

export interface GetEventsIterableInput {
    ethereumUrl?: string
    provider?: ethers.providers.JsonRpcProvider
    managerAddress: string
    events: string[]
}