import { SSVOptions } from '../interfaces/SSVOptions'
import { ValidatorOptions } from '../interfaces/ValidatorOptions'
import { Validator } from '@casimir/types'
import { KeygenInput } from '../interfaces/KeygenInput'
import { OperatorOutput } from '../interfaces/OperatorOutput'
import { DepositData } from '../interfaces/DepositData'
import operatorStore from '../data/operator_store.json'

export class SSV {
    /** Key generation service URL */
    keygenServiceUrl: string

    /**
     * SSV constructor
     * @param {SSVOptions} options - SSV options
     * @example
     * const ssv = new SSV({ keygenUrl: 'http://0.0.0.0:8000' })
     * const validators = await ssv.createValidators({
     *   operatorIds: [1, 2, 3, 4, 5, 6, 7, 8],
     *   validatorCount: 2,
     *   withdrawalAddress: '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
     * })
     */
    constructor(options?: SSVOptions) {
        this.keygenServiceUrl = options?.keygenUrl || process.env.KEYGEN_URL || 'http://0.0.0.0:8000'
    }

    /** 
     * Create validator deposit data and SSV operator key shares 
     * @param {ValidatorOptions} options - Options for creating validators
     * @returns {Promise<Validator[]>} Array of validators
     * @example
     * const validators = await createValidators({
     *   operatorIds: [1, 2, 3, 4, 5, 6, 7, 8],
     *   validatorCount: 2,
     *   withdrawalAddress: '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
     * })
     */
    async createValidators(options: ValidatorOptions): Promise<Validator[]> {

        /** Wait for keygen service to be ready */
        await this.waitForKeygenService()

        const operatorIds = options?.operatorIds || process.env.OPERATOR_IDS?.split(',').map(id => parseInt(id)) || [1, 2, 3, 4/*, 5, 6, 7, 8*/]
        const validatorCount = options?.validatorCount || parseInt(process.env.VALIDATOR_COUNT || '1')
        const withdrawalAddress = options?.withdrawalAddress || process.env.MOCK_ADDRESS || '0x07e05700cb4e946ba50244e27f01805354cd8ef0'

        const validators: Validator[] = []
        const groupSize = 4
        let operatorIndex = 0

        /** Use select {operatorIds} to create {validatorCount} validators */
        for (let index = 0; index < validatorCount; index++) {

            /** Use next operator index for group slicing */
            const nextOperatorIndex = operatorIndex + groupSize
            const groupIds = operatorIds.slice(operatorIndex, nextOperatorIndex)
            const group = this.getOperatorGroup(groupIds)

            /** Start a keygen for the current group of operators */
            const keygenId = await this.startKeygen({ operators: group, withdrawalAddress })
            console.log(`Keygen ID: ${keygenId}`)

            /** Get operator key shares */
            const keygenShares = await this.getKeygenShares(keygenId)

            /** Get validator deposit data */
            const { depositDataRoot, publicKey, signature, withdrawalCredentials } = await this.getKeygenDepositData(keygenId)

            /** Create validator */
            const validator: Validator = {
                depositDataRoot,
                publicKey,
                operatorIds: groupIds, 
                sharesEncrypted: keygenShares.map(share => share.encryptedShare),
                sharesPublicKeys: keygenShares.map(share => share.publicKey),
                signature,
                withdrawalCredentials
            }
            validators.push(validator)

            /** Update operator starting index for next group */
            operatorIndex = nextOperatorIndex
        }
        return validators
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

    /**
     * Start a new key generation
     * @param {KeygenInput} input - Key generation input
     * @returns {Promise<string>} Key generation ID
     * @example
     * const id = await startKeygen({
     *    operators: {
     *       "1": "http://host.docker.internal:8081",
     *       "2": "http://host.docker.internal:8082",
     *       "3": "http://host.docker.internal:8083",
     *       "4": "http://host.docker.internal:8084"
     *    },
     *    withdrawalAddress: '0x07e05700cb4e946ba50244e27f01805354cd8ef0'
     * })
     * console.log(id) 
     * // => "b7e8b0e0-5c1a-4b1e-9b1e-8c1c1c1c1c1c"
     */
    async startKeygen(input: KeygenInput): Promise<string> {
        const { operators, withdrawalAddress } = input
        const withdrawalCredentials = `01${'0'.repeat(22)}${withdrawalAddress.split('0x')[1]}`
        const startKeygen = await this.retry(`${this.keygenServiceUrl}/keygen`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operators,
                threshold: Object.keys(operators).length - 1,
                withdrawal_credentials: withdrawalCredentials,
                fork_version: 'prater'
            })
        })
        const { request_id: keygenId } = await startKeygen.json()
        return keygenId
    }

    /**
     * Get key generation operator shares and public keys
     * @param {string} keygenId - Key generation ID
     * @returns {Promise<OperatorOutput[]>} Array of operator shares and public keys
     * @example
     * const shares = await getKeygenShares('b7e8b0e0-5c1a-4b1e-9b1e-8c1c1c1c1c1c')
     * console.log(shares)
     * // => [
     * //     {
     * //         encryptedShare: "0x000000...",
     * //         publicKey: "0x000000..."
     * //     },
     * //     ...
     * // ]
     */
    async getKeygenShares(keygenId: string): Promise<OperatorOutput[]> {
        const getKeyData = await this.retry(`${this.keygenServiceUrl}/data/${keygenId}`)
        const { output: keyData } = await getKeyData.json()
        const keygenShares = []
        for (const id in keyData) {
            const { Data: shareData } = keyData[id]
            const { EncryptedShare: encryptedShare, SharePubKey: sharePublicKey } = shareData
            keygenShares.push({
                encryptedShare: `0x${encryptedShare}`,
                publicKey: `0x${sharePublicKey}`
            })
        }
        return keygenShares
    }

    /**
     * Get key generation deposit data
     * @param {string} keygenId - Key generation ID
     * @returns {Promise<DepositData>} Deposit data
     * @example
     * const depositData = await getKeygenDepositData('b7e8b0e0-5c1a-4b1e-9b1e-8c1c1c1c1c1c')
     * console.log(depositData)
     * // => {
     * //     depositDataRoot: "0x000000...",
     * //     publicKey: "0x000000...",
     * //     signature: "0x000000...",
     * //     withdrawalCredentials: "0x000000..."
     * // }
     */
    async getKeygenDepositData(keygenId: string): Promise<DepositData> {
        const getDepositData = await this.retry(`${this.keygenServiceUrl}/deposit_data/${keygenId}`)
        const [ depositData ] = await getDepositData.json()
        const {
            deposit_data_root: depositDataRoot, 
            pubkey: publicKey,
            signature,
            withdrawal_credentials: withdrawalCredentials
        } = depositData
        return {
            depositDataRoot: `0x${depositDataRoot}`,
            publicKey: `0x${publicKey}`,
            signature: `0x${signature}`,
            withdrawalCredentials: `0x${withdrawalCredentials}`
        }
    }

    /**
     * Retry a fetch request
     * @param {RequestInfo} info - URL string or request object
     * @param {RequestInit} init - Request init options
     * @param {number} retriesLeft - Number of retries left (default: 5)
     * @returns {Promise<Response>} Response
     * @example
     * const response = await retry('https://example.com')
     */
    async retry(info: RequestInfo, init?: RequestInit, retriesLeft = 10): Promise<Response> {
        const response = await fetch(info, init)
        if (response.status !== 200) {
            if (retriesLeft === 0) {
                throw new Error('API request failed after maximum retries')
            }
            console.log('Retrying fetch...')
            await new Promise(resolve => setTimeout(resolve, 5000))
            return await this.retry(info, init, retriesLeft - 1)
        }
        return response
    }

    /**
     * Wait for key generation service to be ready
     * @param {string} keygenServiceUrl - Key generation service URL
     * @returns {Promise<boolean>}
     */
    async waitForKeygenService(): Promise<void> {
        let ready = false
        while (!ready) {
            try {
                await fetch(`${this.keygenServiceUrl}/health`)
                ready = true
            } catch (error) {
                console.log('Waiting for key generation service...')
                await new Promise(resolve => setTimeout(resolve, 1000))
            }
        }
    }
}