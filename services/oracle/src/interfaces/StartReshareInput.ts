export interface StartReshareInput {
    operators: Record<string, string>
    publicKey: string
    oldOperators: Record<string, string>
}