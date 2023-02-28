export interface ValidatorOptions {
    /** Eligible operator IDs */
    operatorIds?: number[]
    /** Number of validators to create */
    validatorCount?: number
    /** Validator withdrawal address */
    withdrawalAddress?: string
}