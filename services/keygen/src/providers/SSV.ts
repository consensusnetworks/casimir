import { ethers } from 'ethers'
import { fetch } from 'undici'
import { ISharesKeyPairs, SSVKeys } from 'ssv-keys'
import { IOperator, IValidator } from '@casimir/types'
import { IKeyGenOptions } from '../interfaces/IKeyGenOptions'
import { IDepositData } from '../interfaces/IDepositData'

export default class SSV {
    async createKeys (options: IKeyGenOptions) {
        const { keyCount, operatorIds } = options
        const groupSize = 4 // SSV default 3/4 threshold
        const validators: IValidator[] = []
        const operators = await this.getOperators(operatorIds)
        
        /** Create specified count of validator keys of group size */
        let operatorIndex = 0
        for (let count = 0; count < keyCount; count++) {
            operatorIndex += groupSize
            const ssvKeys = new SSVKeys(SSVKeys.VERSION.V3)
            const { deposit_data_root: depositDataRoot, signature }: IDepositData = await import (`../mock/keystores/deposit_data-${count + 1}.json`)
            const keystore = JSON.stringify(await import(`../mock/keystores/keystore-${count + 1}.json`))
            const keystorePassword = 'Testingtest1234'
            const privateKey = await ssvKeys.getPrivateKeyFromKeystoreData(keystore, keystorePassword)

            const group = operators.slice(count, count + operatorIndex)
            const groupPublicKeys = group.map(o => o.public_key)
            const groupIds = group.map(o => o.id)
            const { shares, validatorPublicKey }: ISharesKeyPairs = await ssvKeys.createThreshold(privateKey, groupIds)
            const encryptedShares = await ssvKeys.encryptShares(groupPublicKeys, shares)

            const validator: IValidator = {
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
        const operators: IOperator[] = []
        for (const id of operatorIds) {
            // Todo add mockability in test
            const response = await fetch(`https://api.ssv.network/api/v1/operators/${id}`)
            const operator = await response.json() as IOperator
            operators.push(operator)
        }
        return operators
    }

}