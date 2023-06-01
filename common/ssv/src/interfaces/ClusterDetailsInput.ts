import { ethers } from 'ethers'

export interface ClusterDetailsInput {
    /** JSON RPC node provider */
    provider: ethers.providers.JsonRpcProvider
    /** Operator IDs */
    operatorIds: number[]
    /** Withdrawal address */
    withdrawalAddress: string
}