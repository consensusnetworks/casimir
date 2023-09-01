import { ethers } from 'ethers'

export interface HandlerInput {
    args: {
        requestId?: string
        requestingContract?: string
        requestInitiator?: string
        subscriptionId?: ethers.BigNumber
        subscriptionOwner?: string
        data?: string
    }
}