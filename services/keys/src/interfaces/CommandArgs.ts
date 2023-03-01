export interface CommandArgs {
    /** The distributed key generation API service URL */
    dkgServiceUrl: string
    /** Operator registry IDs */
    operatorIds: number[]
    /** Validator withdrawal address */
    withdrawalAddress: string
}