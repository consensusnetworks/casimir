import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { ethers } from 'ethers'

export interface ReshareValidatorInput {
    /** JSON RPC provider */
    provider: ethers.providers.JsonRpcProvider
    /** Manager contract */
    manager: ethers.Contract & CasimirManager
    /** Validator public key */
    publicKey: string
    /** Operator registry IDs */
    operatorIds: number[]
    /** Old operator registry IDs */
    oldOperatorIds: number[]
    /** Validator withdrawal address */
    withdrawalAddress: string
}