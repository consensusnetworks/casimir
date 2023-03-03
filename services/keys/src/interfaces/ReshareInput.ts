export interface ReshareInput {
    /** Operator map with DKG endpoints */
    operators: Record<string, string>;
    /** Validator public key */
    validatorPublicKey: string;
    /** Old operator registry IDs */
    oldOperators: Record<string, string>;
}