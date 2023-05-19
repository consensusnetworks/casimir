import { ISSVNetwork } from '@casimir/ethereum/build/artifacts/types'
import { ethers } from 'ethers'

export interface ClusterInput {
    /** SSV network contract */
    ssv: ISSVNetwork & ethers.Contract
    /** Operator IDs */
    operatorIds: number[]
    /** JSON RPC node provider */
    provider: ethers.JsonRpcProvider
    /** Withdrawal address */
    withdrawalAddress: string
}