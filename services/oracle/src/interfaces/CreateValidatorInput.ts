export interface CreateValidatorInput {
    poolId: number
    operatorIds: number[]
    ownerAddress: string
    ownerNonce: number
    withdrawalAddress: string
}