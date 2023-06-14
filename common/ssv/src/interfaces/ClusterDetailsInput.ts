import { ethers } from 'ethers'

export interface ClusterDetailsInput {
    /** JSON RPC node provider */
    provider: ethers.providers.JsonRpcProvider
    /** Owner address */
    ownerAddress: string
    /** Operator IDs */
    operatorIds: number[]
}