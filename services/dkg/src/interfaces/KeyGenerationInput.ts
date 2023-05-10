export interface KeyGenerationInput {
    /** Operator map with DKG endpoints */
    operators: Record<string, string>;
    /** Withdrawal address */
    withdrawalAddress: string;
}