export interface CommandArgs {
    /** The distributed key generation API service URL */
    dkgServiceUrl: string
    /** Operator registry IDs */
    operatorIds: number[]
    /** Validator public key */
    validatorPublicKey: string
    /** Validator withdrawal address */
    withdrawalAddress: string
    /** Old operator registry IDs */
    oldOperatorIds: number[]
}