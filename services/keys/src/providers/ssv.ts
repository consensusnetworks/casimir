import { Validator } from '@casimir/types'
import { operatorStore } from '@casimir/data'
import { DKG } from './dkg'
import { SSVOptions } from '../interfaces/SSVOptions'
import { CreateValidatorOptions } from '../interfaces/CreateValidatorOptions'
import { ReshareValidatorOptions } from '../interfaces/ReshareValidatorOptions'

export class SSV {
    /** Distributed key generation API service */
    dkgService: DKG

    /**
     * SSV constructor
     * @param {SSVOptions} options - SSV options
     * @example
     * const ssv = new SSV({ dkgServiceUrl: 'http://0.0.0.0:8000' })
     * const validators = await ssv.createValidator({
     *   operatorIds: [1, 2, 3, 4],
     *   withdrawalAddress: '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
     * })
     */
    constructor(options: SSVOptions) {
        this.dkgService = new DKG({ serviceUrl: options.dkgServiceUrl })
    }

    /** 
     * Create validator with operator key shares and deposit data
     * @param {CreateValidatorOptions} options - Options for creating a validator
     * @returns {Promise<Validator>} Validator with operator key shares and deposit data
     * @example
     * const validator = await createValidator({
     *   operatorIds: [1, 2, 3, 4],
     *   withdrawalAddress: '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
     * })
     */
    async createValidator(options: CreateValidatorOptions): Promise<Validator> {

        const operatorIds = options?.operatorIds || process.env.OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [1, 2, 3, 4, 5, 6, 7, 8]
        const withdrawalAddress = options?.withdrawalAddress || process.env.WITHDRAWAL_ADDRESS || '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
        const operators = this.getOperatorGroup(operatorIds)

        /** Start a key generation ceremony with the given operators */
        const ceremonyId = await this.dkgService.startKeyGeneration({ operators, withdrawalAddress })
        console.log(`Started ceremony with ID ${ceremonyId}`)

        /** Wait for ceremony to complete */
        await new Promise(resolve => setTimeout(resolve, 2000))

        /** Get operator key shares */
        const { encryptedKeys, publicKeys } = await this.dkgService.getShares(ceremonyId)

        /** Get validator deposit data */
        const { depositDataRoot, publicKey, signature, withdrawalCredentials } = await this.dkgService.getDepositData(ceremonyId, withdrawalAddress)

        /** Create validator */
        const validator: Validator = {
            depositDataRoot,
            publicKey,
            operatorIds, 
            sharesEncrypted: encryptedKeys,
            sharesPublicKeys: publicKeys,
            signature,
            withdrawalCredentials
        }

        return validator
    }

    /** 
     * Reshare validator for new operator key shares and deposit data
     * @param {ReshareValidatorOptions} options - Options for resharing a validator
     * @returns {Promise<Validator>} Validator with operator key shares and deposit data
     * @example
     * const validator = await reshareValidator({
     *   operatorIds: [1, 2, 3, 4],
     *   validatorPublicKey: '0x8eb0f05adc697cdcbdf8848f7f1e8c2277f4fc7b0efc97ceb87ce75286e4328db7259fc0c1b39ced0c594855a30d415c',
     *   oldOperators: {
     *     "2": "http://0.0.0.0:8082",
     *     "3": "http://0.0.0.0:8083",
     *     "4": "http://0.0.0.0:8084"
     *   }
     * })
     */
    async reshareValidator(options: ReshareValidatorOptions): Promise<Validator> {

        const operatorIds = options?.operatorIds || process.env.OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [2, 3, 4, 5]
        const validatorPublicKey = options?.validatorPublicKey || process.env.VALIDATOR_PUBLIC_KEY || '0x8eb0f05adc697cdcbdf8848f7f1e8c2277f4fc7b0efc97ceb87ce75286e4328db7259fc0c1b39ced0c594855a30d415c'
        const oldOperatorIds = options?.oldOperatorIds || process.env.OLD_OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [2, 3, 4]
        const operators = this.getOperatorGroup(operatorIds)
        const oldOperators = this.getOperatorGroup(oldOperatorIds)
        const withdrawalAddress = options?.withdrawalAddress || process.env.WITHDRAWAL_ADDRESS || '0x07e05700cb4e946ba50244e27f01805354cd8ef0'

        /** Start a key generation ceremony with the given operators */
        const ceremonyId = await this.dkgService.startReshare({ operators, validatorPublicKey, oldOperators })
        console.log(`Started ceremony with ID ${ceremonyId}`)

        /** Get operator key shares */
        const { encryptedKeys, publicKeys } = await this.dkgService.getShares(ceremonyId)

        /** Get validator deposit data */
        const { depositDataRoot, publicKey, signature, withdrawalCredentials } = await this.dkgService.getDepositData(ceremonyId, withdrawalAddress)

        /** Create validator */
        const validator: Validator = {
            depositDataRoot,
            publicKey,
            operatorIds, 
            sharesEncrypted: encryptedKeys,
            sharesPublicKeys: publicKeys,
            signature,
            withdrawalCredentials
        }

        return validator
    }

    /**
     * Get operator group from operator IDs
     * @param {number[]} operatorIds - Array of operator IDs
     * @returns {<Record<string, string>} Operator group
     * @example
     * const group = getOperatorGroup([1, 2, 3, 4])
     * console.log(group) 
     * // => {
     * //     "1": "http://0.0.0.0:8081",
     * //     "2": "http://0.0.0.0:8082",
     * //     "3": "http://0.0.0.0:8083",
     * //     "4": "http://0.0.0.0:8084"
     * // }
     */
    getOperatorGroup(operatorIds: number[]): Record<string, string> {
        return operatorIds.reduce((group: Record<string, string>, id: number) => {
            const key = id.toString() as keyof typeof operatorStore
            group[key] = operatorStore[key]
            return group
        }, {})
    }
}