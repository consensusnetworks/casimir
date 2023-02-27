import { SSVKeys } from 'ssv-keys'
import { Validator } from '@casimir/types'
import { CreateValidatorsOptions } from '../interfaces/CreateValidatorsOptions'
import { DepositData } from '../interfaces/DepositData'
import operators from '../data/operators.json'

export class SSV {

    keys: SSVKeys = new SSVKeys(SSVKeys.VERSION.V3)

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

            /** Start a keygen for the current group of operators */
            const groupIds = operatorIds.slice(operatorIndex, nextOperatorIndex)
            const group = this.getOperatorGroup(groupIds)
            
            const keyGen = await fetch('http://0.0.0.0:8000/keygen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    operators: group,
                    threshold: groupIds.length - 1,
                    withdrawal_credentials: `01${'0'.repeat(22)}${withdrawalAddress.split('0x')[1]}`,
                    fork_version: 'prater'
                })
            })

            const { request_id: requestId } = await keyGen.json()

            const keyData = await this.retry(`http://0.0.0.0:8000/data/${requestId}`)
            const { output } = await keyData.json()
            console.log(output)

            const depositData = await this.retry(`http://0.0.0.0:8000/deposit_data/${requestId}`)
            console.log(await depositData.json())

            /** Update operator starting index for next group */
            operatorIndex = nextOperatorIndex

            // /** Create validator */
            // const validator: Validator = {
            //     depositDataRoot,
            //     publicKey,
            //     operatorIds: groupIds, 
            //     sharesEncrypted: encryptedShares.map(s => s.privateKey),
            //     sharesPublicKeys: encryptedShares.map(s => s.publicKey),
            //     signature,
            //     withdrawalCredentials
            // }
            // validators.push(validator)

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
            const key = id.toString() as keyof typeof operators
            group[key] = operators[key]
            return group
        }, {})
    }

    /**
     * Retry fetch request
     * @param {string} url - URL to fetch
     * @param {number} retriesLeft - Number of retries left
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