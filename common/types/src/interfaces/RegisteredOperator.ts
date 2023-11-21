import { PoolConfig } from "./PoolConfig"
import { Operator } from "@casimir/ssv"

export interface RegisteredOperator extends Operator {
    active: boolean
    collateral: string
    poolCount: number
    pools: PoolConfig[]
    resharing: boolean
    url: string
}
