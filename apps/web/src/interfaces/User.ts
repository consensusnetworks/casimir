import { ProviderString } from '@/types/ProviderString'
import { Pool } from './Pool'

export interface User {
    address: string
    accounts: Array<{
        address: string
        currency: string
        balance: string
        balanceSnapshots: Array<{   
            date: string
            balance: string
        }>
        roi: number
        walletProvider: string
    }>
    stake?: string
    rewards?: string
    pools?: Pool[]
}