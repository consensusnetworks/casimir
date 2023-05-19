import { ethers } from 'ethers'

export interface Cluster {
    validatorCount: number | ethers.BigNumber
    networkFeeIndex: number | ethers.BigNumber
    index: number | ethers.BigNumber
    balance: number | ethers.BigNumber
    active: boolean
}