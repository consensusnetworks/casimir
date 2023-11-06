import { ethers } from "ethers"

export interface Operator {
    id: number
    fee: ethers.BigNumber
    isPrivate: boolean
    ownerAddress: string
    validatorCount: number
}