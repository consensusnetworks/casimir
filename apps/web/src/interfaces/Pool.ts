export interface Pool {
    id: number
    totalStake: string
    totalRewards: string
    userStake: string
    userRewards: string
    validator?: {
        publicKey: string
        status?: string
        effectiveness?: string
        apr?: string // See issue #205 https://github.com/consensusnetworks/casimir/issues/205#issuecomment-1338142532
        url?: string // https://beaconcha.in/validator/{publicKey}
    }
    operators?: {
        id: number
        publicKey?: string
        '24HourPerformance'?: number
        '30DayPerformance'?: number
        url?: string // https://explorer.ssv.network/operators/{id}
    }
}