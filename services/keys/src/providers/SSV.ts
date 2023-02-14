import { fetch } from 'undici'
import { ISharesKeyPairs, SSVKeys } from 'ssv-keys'
import { Operator, Validator } from '@casimir/types'
import { CreateValidatorsOptions } from '../interfaces/CreateValidatorsOptions'
import { DepositData } from '../interfaces/DepositData'

export default class SSV {

    keys: SSVKeys = new SSVKeys(SSVKeys.VERSION.V3)

    /** 
     * Create validator deposit data and SSV operator key shares 
     * @param {CreateValidatorsOptions} options - Options for creating validators
     * @returns {Promise<Validator[]>} Array of validators
     */
    async createValidators(options?: CreateValidatorsOptions): Promise<Validator[]> {

        /** Use select {operatorIds} to create {validatorCount} validators */
        const operatorIds = options?.operatorIds
        const validatorCount = options?.validatorCount || 1

        const validators: Validator[] = []
        const operators = await this.getOperators(operatorIds)

        const groupSize = 4
        let operatorIndex = 0
        for (let index = 0; index < validatorCount; index++) {
            
            /** Get deposit data and keys for validator */
            const { depositDataRoot, publicKey, signature, withdrawalCredentials } = await this.getDepositData(index)
            const keystore: string = JSON.stringify(await import(`../../mock/keystore-${index}.json`))
            const keystorePassword = 'Testingtest1234'
            const privateKey = await this.keys.getPrivateKeyFromKeystoreData(keystore, keystorePassword)
            
            /** Use next operator index for group slicing */
            const nextOperatorIndex = operatorIndex + groupSize

            /** Create threshold for group of operators */
            const group = operators.slice(operatorIndex, nextOperatorIndex)
            const groupIds = group.map((o: Operator) => o.id)
            const groupPublicKeys = group.map((o: Operator) => o.public_key)
            const { shares }: ISharesKeyPairs = await this.keys.createThreshold(privateKey, groupIds)
            const encryptedShares = await this.keys.encryptShares(groupPublicKeys, shares, SSVKeys.SHARES_FORMAT_ABI)

            /** Update operator starting index for next group */
            operatorIndex = nextOperatorIndex

            /** Create validator */
            const validator: Validator = {
                depositDataRoot,
                publicKey,
                operatorIds: groupIds, 
                sharesEncrypted: encryptedShares.map(s => s.privateKey),
                sharesPublicKeys: encryptedShares.map(s => s.publicKey),
                signature,
                withdrawalCredentials
            }
            validators.push(validator)
        }
        return validators
    }

    /**
     * Get deposit data for a validator
     * @param {number} index - Validator index
     * @returns {Promise<DepositData>} Returns a promise of the validator deposit data
     */
    async getDepositData(index: number): Promise<DepositData> {
        const { deposit_data_root, pubkey, signature, withdrawal_credentials } = await import(`../../mock/deposit_data-${index}.json`) 
        return {
            depositDataRoot: `0x${deposit_data_root}`,
            publicKey: `0x${pubkey}`,
            signature: `0x${signature}`,
            withdrawalCredentials: `0x${withdrawal_credentials}`
        }   
    }

    /**
     * Get operators from SSV API or local data
     * @param {number[]} operatorIds - Optional operator IDs
     * @returns {Promise<Operator[]>} Returns a promise of the operator list given optional IDs
     */
    async getOperators(operatorIds?: number[]): Promise<Operator[]> {
        if (operatorIds) {
            const operators: Operator[] = []
            for (const id of operatorIds) {
                const response = await fetch(`https://api.ssv.network/api/v1/operators/${id}`)
                const operator = await response.json() as Operator
                operators.push(operator)
            }
            return operators
        }
        const { operators } = await import('../../mock/operators.json')
        return operators
    }

}