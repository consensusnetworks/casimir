import { ISSVNetwork } from '@casimir/ethereum/build/artifacts/types'
import { ethers } from 'ethers'

export interface CreateValidatorInput {
    /** SSV network contract */
    ssv: ISSVNetwork & ethers.Contract
    /** Operator registry IDs */
    operatorIds: number[]
    /** JSON RPC provider */
    provider: ethers.JsonRpcProvider
    /** Validator withdrawal address */
    withdrawalAddress: string
}