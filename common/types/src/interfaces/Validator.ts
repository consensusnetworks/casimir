export interface Validator {
    depositDataRoot: string
    publicKey: string
    operatorIds: number[]
    sharesEncrypted: string[]
    sharesPublicKeys: string[]
    signature: string
    withdrawalCredentials: string
}