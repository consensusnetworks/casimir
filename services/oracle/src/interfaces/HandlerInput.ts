import { ICasimirFactory } from '@casimir/ethereum/build/@types'
import { ethers } from 'ethers'

export interface HandlerInput {
    managerConfig: ICasimirFactory.ManagerConfigStructOutput
    args?: ethers.utils.Result
}