import { ethers } from 'ethers'
import { fetch } from 'undici'
import { ISharesKeyPairs, SSVKeys } from 'ssv-keys'
import { Operator, Validator } from '@casimir/types'
import { CreateValidatorsOptions } from '../interfaces/CreateValidatorsOptions'
import { DepositData } from '../interfaces/DepositData'

export default class SSV {

    /** 
     * Create validator deposit data and SSV operator key shares 
     */
    async createValidators (options: CreateValidatorsOptions) {

        /** Use select {operatorIds} to create {validatorCount} validators */
        const operatorIds = options.operatorIds || [1, 2, 3, 4]
        const validatorCount = options.validatorCount || 1
        
        const validators: Validator[] = []
        const operators = await this.getOperators(operatorIds)
        
        const groupSize = 4
        let operatorIndex = 0
        for (let count = 0; count < validatorCount; count++) {
            operatorIndex += groupSize
            const ssvKeys = new SSVKeys(SSVKeys.VERSION.V3)
            const { deposit_data_root: depositDataRoot, signature }: DepositData = await import (`../mock/keystores/deposit_data-${count + 1}.json`)
            const keystore = JSON.stringify(await import(`../mock/keystores/keystore-${count + 1}.json`))
            const keystorePassword = 'Testingtest1234'
            const privateKey = await ssvKeys.getPrivateKeyFromKeystoreData(keystore, keystorePassword)

            const group = operators.slice(count, count + operatorIndex)
            const groupPublicKeys = group.map(o => o.public_key)
            const groupIds = group.map(o => o.id)
            const { shares, validatorPublicKey }: ISharesKeyPairs = await ssvKeys.createThreshold(privateKey, groupIds)
            const encryptedShares = await ssvKeys.encryptShares(groupPublicKeys, shares)

            const validator: Validator = {
              depositDataRoot: ethers.utils.sha256(ethers.utils.toUtf8Bytes(depositDataRoot)), // Todo check this format
              operatorIds: groupIds,
              operatorPublicKeys: encryptedShares.map(s => ethers.utils.sha256(ethers.utils.toUtf8Bytes(s.operatorPublicKey))),
              sharesEncrypted: encryptedShares.map(s => ethers.utils.sha256(ethers.utils.toUtf8Bytes(s.privateKey))),
              sharesPublicKeys: encryptedShares.map(s => s.publicKey),
              signature: ethers.utils.sha256(ethers.utils.toUtf8Bytes(signature)), // Todo check this format
              validatorPublicKey
            }
            validators.push(validator)

        }
        return validators
    }

    async getOperators (operatorIds: number[]) {
        const operators: Operator[] = []
        for (const id of operatorIds) {
            // Todo add mockability in test
            const response = await fetch(`https://api.ssv.network/api/v1/operators/${id}`)
            const operator = await response.json() as Operator
            operators.push(operator)
        }
        return operators
    }

}