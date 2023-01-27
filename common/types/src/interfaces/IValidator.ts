export interface IValidator {
    depositDataRoot: string
    operatorIds: number[]
    operatorPublicKeys: string[]
    sharesEncrypted: string[]
    sharesPublicKeys: string[]
    signature: string
    validatorPublicKey: string
}