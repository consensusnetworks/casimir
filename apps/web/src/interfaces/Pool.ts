export interface Pool {
    id: number
    totalStake: string
    totalRewards: string
    userStake: string
    userRewards: string
    validator?: {
        publicKey: string
    }
    operators?: {
        id: number
    }
}