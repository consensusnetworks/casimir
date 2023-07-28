export interface ReshareValidatorInput {
    publicKey: string
    poolId: number
    operatorIds: number[]
    oldOperatorIds: number[]
    withdrawalAddress: string
}