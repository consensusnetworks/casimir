import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { ethers } from 'ethers'

export interface CreateValidatorInput {
    /** JSON RPC provider */
    provider: ethers.providers.JsonRpcProvider
    /** Manager contract */
    manager: ethers.Contract & CasimirManager
    /** Operator registry IDs */
    operatorIds: number[]
    /** Validator withdrawal address */
    withdrawalAddress: string
}