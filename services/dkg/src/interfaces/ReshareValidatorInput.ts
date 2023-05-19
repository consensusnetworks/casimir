import { ISSVNetwork } from '@casimir/ethereum/build/artifacts/types'
import { ethers } from 'ethers'

export interface ReshareValidatorInput {
    /** SSV network contract */
    ssv: ISSVNetwork & ethers.Contract
    /** JSON RPC provider */
    provider: ethers.JsonRpcProvider
    /** Operator registry IDs */
    operatorIds: number[]
    /** Validator public key */
    publicKey: string
    /** Old operator registry IDs */
    oldOperatorIds: number[]
    /** Validator withdrawal address */
    withdrawalAddress: string
}