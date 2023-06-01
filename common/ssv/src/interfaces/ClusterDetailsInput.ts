import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { ethers } from 'ethers'

export interface ClusterDetailsInput {
    /** JSON RPC node provider */
    provider: ethers.providers.JsonRpcProvider
    /** SSV network address */
    networkAddress: string
    /** SSV network views address */
    networkViewsAddress: string
    /** Operator IDs */
    operatorIds: number[]
    /** Withdrawal address */
    withdrawalAddress: string
}