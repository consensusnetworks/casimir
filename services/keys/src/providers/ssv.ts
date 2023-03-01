import { SSVOptions } from '../interfaces/SSVOptions'
import { ValidatorOptions } from '../interfaces/ValidatorOptions'
import { Validator } from '@casimir/types'
import { DKG } from './dkg'
import { Share } from '../interfaces/Share'
import operatorStore from '../data/operator_store.json'

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
     * @param {ValidatorOptions} options - Options for creating validator
     * @returns {Promise<Validator>} Validator with operator key shares and deposit data
     * @example
     * const validator = await createValidator({
     *   operatorIds: [1, 2, 3, 4],
     *   withdrawalAddress: '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
     * })
     */
    async createValidator(options: ValidatorOptions): Promise<Validator> {

        /** Start the local DKG service in development mode */
        if (this.dkgService.serviceUrl.includes('0.0.0.0')) {
            console.log('Starting local DKG service...')
            await this.dkgService.start()
        }

        const operatorIds = options?.operatorIds || process.env.OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [1, 2, 3, 4, 5, 6, 7, 8]
        const withdrawalAddress = options?.withdrawalAddress || process.env.WITHDRAWAL_ADDRESS || '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
        const operators = this.getOperatorGroup(operatorIds)

        /** Start a key generation ceremony with the given operators */
        const dkgId = await this.dkgService.startKeyGeneration({ operators, withdrawalAddress })
        console.log(`Started ceremony with ID ${dkgId}`)

        /** Get operator key shares */
        const dkgShares = await this.dkgService.getShares(dkgId)

        /** Get validator deposit data */
        const { depositDataRoot, publicKey, signature, withdrawalCredentials } = await this.dkgService.getDepositData(dkgId)

        /** Create validator */
        const validator: Validator = {
            depositDataRoot,
            publicKey,
            operatorIds, 
            sharesEncrypted: dkgShares.map((share: Share) => share.encryptedShare),
            sharesPublicKeys: dkgShares.map((share: Share) => share.publicKey),
            signature,
            withdrawalCredentials
        }

        /** Stop up the local DKG service in development mode */
        if (this.dkgService.serviceUrl.includes('0.0.0.0')) {
            console.log('Stopping local DKG service...')
            await this.dkgService.stop()
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
     * //     "1": "http://host.docker.internal:8081",
     * //     "2": "http://host.docker.internal:8082",
     * //     "3": "http://host.docker.internal:8083",
     * //     "4": "http://host.docker.internal:8084"
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