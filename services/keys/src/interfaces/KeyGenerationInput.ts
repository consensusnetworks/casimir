export interface KeyGenerationInput {
    /** Operator registry IDs */
    operators: Record<string, string>;
    /** Withdrawal address */
    withdrawalAddress: string;
}