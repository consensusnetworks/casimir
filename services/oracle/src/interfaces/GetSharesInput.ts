export interface GetSharesInput {
    requestId: string
    operators: Record<string, string>
    ownerAddress: string
    ownerNonce: number
}