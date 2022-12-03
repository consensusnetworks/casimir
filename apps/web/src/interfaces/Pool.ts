export interface Pool {
    id: number
    totalStake: string
    totalRewards: string
    userStake: string
    userRewards: string
    validatorAddress?: string
    operatorIds?: number[]
}