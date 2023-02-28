import { Validator } from '@casimir/types'
import { CreateValidatorsOptions } from '../interfaces/CreateValidatorsOptions'
import { KeyGenInput } from '../interfaces/KeyGenInput'
import { OperatorShare } from '../interfaces/OperatorShare'
import { DepositData } from '../interfaces/DepositData'
import operatorStore from '../data/operator_store.json'

export class SSV {
    /** Key generation service URL */
    keyGenUrl: string

    constructor() {
        this.keyGenUrl = process.env.KEY_GEN_URL || 'http://0.0.0.0:8000'
    }

    /** 
     * Create validator deposit data and SSV operator key shares 
     * @param {CreateValidatorsOptions} options - Options for creating validators
     * @returns {Promise<Validator[]>} Array of validators
     */
    async createValidators(options?: CreateValidatorsOptions): Promise<Validator[]> {

        /** Use select {operatorIds} to create {validatorCount} validators */
        const operatorIds = options?.operatorIds || [1, 2, 3, 4, 5, 6, 7, 8]
        const validatorCount = options?.validatorCount || 1
        const withdrawalAddress = options?.withdrawalAddress || '0x07e05700cb4e946ba50244e27f01805354cd8ef0'

        const validators: Validator[] = []
        const groupSize = 4
        let operatorIndex = 0
        for (let index = 0; index < validatorCount; index++) {

            /** Use next operator index for group slicing */
            const nextOperatorIndex = operatorIndex + groupSize
            const groupIds = operatorIds.slice(operatorIndex, nextOperatorIndex)
            const group = this.getOperatorGroup(groupIds)

            /** Start a keygen for the current group of operators */
            const keyGenId = await this.startKeyGen({ operators: group, withdrawalAddress })

            /** Get operator key shares */
            const keyGenShares = await this.getKeyGenShares(keyGenId)

            /** Get validator deposit data */
            const { depositDataRoot, publicKey, signature, withdrawalCredentials } = await this.getKeyGenDepositData(keyGenId)

            /** Create validator */
            const validator: Validator = {
                depositDataRoot,
                publicKey,
                operatorIds: groupIds, 
                sharesEncrypted: keyGenShares.map(share => share.encryptedShare),
                sharesPublicKeys: keyGenShares.map(share => share.publicKey),
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
     * getOperatorGroup([1, 2, 3, 4])
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
     * @param {KeyGenInput} input - Key generation input
     * @returns {Promise<string>} Key generation ID
     */
    async startKeyGen(input: KeyGenInput): Promise<string> {
        const { operators, withdrawalAddress } = input
        const withdrawalCredentials = `01${'0'.repeat(22)}${withdrawalAddress.split('0x')[1]}`
        const startKeyGen = await fetch(`${this.keyGenUrl}/keygen`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                operators,
                threshold: Object.keys(operators).length - 1,
                withdrawal_credentials: withdrawalCredentials,
                fork_version: 'prater'
            })
        })
        const { request_id: keyGenId } = await startKeyGen.json()
        return keyGenId
    }

    /**
     * Get key generation operator shares and public keys
     * @param {string} keyGenId - Key generation ID
     * @returns {Promise<OperatorShare[]>} Array of operator shares and public keys
     */
    async getKeyGenShares(keyGenId: string): Promise<OperatorShare[]> {
        const getKeyData = await this.retry(`${this.keyGenUrl}/data/${keyGenId}`)
        const { output: keyData } = await getKeyData.json()
        const keyGenShares = []
        for (const id in keyData) {
            const { Data: shareData } = keyData[id]
            const { EncryptedShare: encryptedShare, SharePubKey: sharePublicKey } = shareData
            keyGenShares.push({
                encryptedShare: `0x${encryptedShare}`,
                publicKey: `0x${sharePublicKey}`
            })
        }
        return keyGenShares
    }

    /**
     * Get key generation deposit data
     * @param {string} keyGenId - Key generation ID
     * @returns {Promise<DepositData>} Deposit data
     */
    async getKeyGenDepositData(keyGenId: string): Promise<DepositData> {
        const getDepositData = await this.retry(`${this.keyGenUrl}/deposit_data/${keyGenId}`)
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
     * Retry fetch request
     * @param {string} url - URL to fetch
     * @param {number} retriesLeft - Number of retries left (default: 5)
     * @returns {Promise<Response>} Response
     */
    async retry(url: string, retriesLeft = 5): Promise<Response> {
        const response = await fetch(url)
        if (response.status !== 200) {
            if (retriesLeft === 0) {
                throw new Error('API request failed after maximum retries')
            }
            console.log(`Retrying ${url}...`)
            await new Promise(resolve => setTimeout(resolve, 1000))
            return await this.retry(url, retriesLeft - 1)
        }
        return response
    }
}