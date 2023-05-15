export interface ReshareValidatorOptions {
    /** Operator registry IDs */
    operatorIds: number[];
    /** Validator public key */
    publicKey: string;
    /** Old operator registry IDs */
    oldOperatorIds: number[];
    /** Validator withdrawal address */
    withdrawalAddress: string
}