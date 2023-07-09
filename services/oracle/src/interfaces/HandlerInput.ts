import { ethers } from 'ethers'
import { CasimirManager, CasimirViews } from '@casimir/ethereum/build/artifacts/types'

export interface HandlerInput {
    /** JSON RPC node provider */
    provider: ethers.providers.JsonRpcProvider
    /** Transaction signer */
    signer: ethers.Signer
    /** Manager contract */
    manager: ethers.Contract & CasimirManager
    /** Views contract */
    views: CasimirViews & ethers.Contract
    /** Link token address */
    linkTokenAddress: string
    /** SSV token address */
    ssvTokenAddress: string
    /** WETH token address */
    wethTokenAddress: string
    /** DKG cli path */
    cliPath: string
    /** DKG messenger service URL */
    messengerUrl: string
    /** Event args */
    args: Record<string, any>
}