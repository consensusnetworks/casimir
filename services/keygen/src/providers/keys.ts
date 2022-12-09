import { EthereumKeyStore as Keystore, Encryption, Threshold } from 'ssv-keys'
import { encode } from 'js-base64'
import { Operator } from '@casimir/types'

// Todo fetch a generated key (and generate one if needed)
import encryptedKeystore from '../mock/keystore.json'

export default function useKeys() {
    async function getDepositData(withdrawalAddress: string, operators: Operator[]) {
        console.log('Creating validator deposit data for', withdrawalAddress)
        const { privateKey } = await getKeys()
        const shares = await getShares(privateKey, operators)
        return { operators, shares }
    }

    async function getKeys() {
        const keystore = new Keystore(JSON.stringify(encryptedKeystore))
        const publicKey = keystore.getPublicKey()
        const privateKey = await keystore.getPrivateKey('Testingtest1234')
        return { publicKey, privateKey }
    }

    async function getShares(privateKey: string, operators: Operator[]) {
        const thresholdInstance = new Threshold()
        const threshold = await thresholdInstance.create(privateKey, operators.map(operator => operator.id))
        const shares = new Encryption(operators.map(operator => operator.public_key), threshold.shares).encrypt()
        const encodedShares = shares.map((share) => {
            return {
                ...share,
                operatorPublicKey: encode(share.operatorPublicKey)
            }
        })
        return encodedShares
    }

    return { getDepositData }
}