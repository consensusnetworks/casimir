export interface CreateValidatorInput {
    /** Pool ID */
    poolId: number
    /** Operator registry IDs */
    operatorIds: number[]
    /** Validator withdrawal address */
    withdrawalAddress: string
}