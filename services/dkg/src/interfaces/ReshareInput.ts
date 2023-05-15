export interface ReshareInput {
    /** Operator map with DKG endpoints */
    operators: Record<string, string>;
    /** Validator public key */
    publicKey: string;
    /** Old operator registry IDs */
    oldOperators: Record<string, string>;
}