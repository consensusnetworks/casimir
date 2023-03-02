export interface ReshareValidatorOptions {
    /** Operator registry IDs */
    operatorIds: number[];
    /** Validator public key */
    validatorPublicKey: string;
    /** Old operator registry IDs */
    oldOperatorIds: number[];
}