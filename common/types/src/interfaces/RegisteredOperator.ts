import { Operator } from '@casimir/ssv'
import { Pool } from './Pool'

export interface RegisteredOperator extends Operator {
    active: boolean
    collateral: string
    poolCount: number
    pools: Pool[]
    url: string
    resharing: boolean
}
