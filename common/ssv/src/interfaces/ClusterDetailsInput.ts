import { ethers } from 'ethers'

export interface ClusterDetailsInput {
    /** SSV network address */
    networkAddress: string
    /** Operator IDs */
    operatorIds: number[]
    /** JSON RPC node provider */
    provider: ethers.providers.JsonRpcProvider
    /** Withdrawal address */
    withdrawalAddress: string
}