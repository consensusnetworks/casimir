import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { ethers } from 'ethers'

export interface CommandOptions {
    /** The manager contract */
    manager: ethers.Contract & CasimirManager
    /** The command signer */
    signer: ethers.Signer
    /** The distributed key generation messenger service URL */
    messengerUrl: string
    /** The pool ID */
    id: number
}