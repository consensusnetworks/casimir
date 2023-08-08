import { ethers } from 'ethers'
import { Operator } from '@casimir/ssv'
import { Pool } from './Pool'

export interface RegisteredOperator extends Operator {
    active: boolean
    collateral: ethers.BigNumber
    poolCount: number
    pools: Pool[]
    url: string
    resharing: boolean
}
