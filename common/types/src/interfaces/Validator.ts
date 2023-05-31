export interface Validator {
    depositDataRoot: string
    publicKey: string
    operatorIds: number[]
    shares: string
    signature: string
    withdrawalCredentials: string
}