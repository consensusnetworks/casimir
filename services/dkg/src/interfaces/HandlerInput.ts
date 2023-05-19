import { ethers } from 'ethers'
import { CasimirManager, ISSVNetwork } from '@casimir/ethereum/build/artifacts/types'

export interface HandlerInput {
    /** Manager contract */
    manager: CasimirManager & ethers.Contract
    /** SSV network contract */
    ssv: ISSVNetwork & ethers.Contract
    /** JSON RPC node provider */
    provider: ethers.JsonRpcProvider
    /** Transaction signer */
    signer: ethers.Signer
    /** DKG cli path */
    cliPath: string
    /** DKG messenger service URL */
    messengerUrl: string
    /** Pool ID */
    id: number
}