export interface ReshareValidatorInput {
    oldOperatorIds: number[]
    operatorIds: number[]
    ownerAddress: string
    ownerNonce: number
    poolId: number
    publicKey: string
    withdrawalAddress: string
}