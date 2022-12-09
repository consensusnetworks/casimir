import { EthereumKeyStore as Keystore, Encryption, Threshold } from 'ssv-keys'
import { encode } from 'js-base64'
import { Operator } from '../interfaces/Operator'

// Todo fetch a generated key (and generate one if needed)
import encryptedKeystore from '../mock/keystore.json'

export default function useKeys () {
    async function getShares(operators: Operator[]) {
        const { privateKey } = await getKeys()
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

    async function getKeys() {
        const keystore = new Keystore(JSON.stringify(encryptedKeystore))
        const publicKey = keystore.getPublicKey()
        const privateKey = await keystore.getPrivateKey('Testingtest1234')
        return { publicKey, privateKey }
    }

    return { getShares }
}