import { CasimirManager } from '@casimir/ethereum/build/artifacts/types'
import { ethers } from 'ethers'

export interface CommandOptions {
    /** Manager contract */
    manager: ethers.Contract & CasimirManager
    /** Command signer */
    signer: ethers.Signer
    /** DKG cli path */
    cliPath: string
    /** DKG messenger service URL */
    messengerUrl: string
    /** Pool ID */
    id: number
}