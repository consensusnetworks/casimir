export interface ReshareValidatorInput {
    publicKey: string
    poolId: number
    operatorIds: number[]
    oldOperatorIds: number[]
    ownerAddress: string
    ownerNonce: number
    withdrawalAddress: string
}