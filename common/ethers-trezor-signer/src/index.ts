import { ethers } from 'ethers'
import { EthersTrezorSignerOptions } from './interfaces/EthersTrezorSignerOptions'
import { MessageSignature } from './interfaces/MessageSignature'
import TrezorConnect, { Address, EthereumTransaction, EthereumSignedTx } from '@trezor/connect-web'

TrezorConnect.manifest({ email: 'support@consensusnetworks.com', appUrl: 'casimir.co' })
const defaultPath = 'm/44\'/60\'/0\'/0/0'

export default class EthersTrezorSigner extends ethers.Signer {
    readonly path: string
    readonly _eth = TrezorConnect

    constructor(options: EthersTrezorSignerOptions) {
        super()

        if (!options.path) options.path = defaultPath
        this.path = options.path

        // Override readonly provider for ethers.Signer
        if (options.provider) {
            ethers.utils.defineReadOnly(this, 'provider', options.provider)
        }

    }

    async getAddress(): Promise<string> {
        const { payload } = await this._eth.ethereumGetAddress({ path: this.path })
        const { address } = payload as Address
        return ethers.utils.getAddress(address)
    }

    async signMessage(message: ethers.utils.Bytes | string): Promise<string> {
        if (typeof(message) === 'string') {
            message = ethers.utils.toUtf8Bytes(message)
        }
        const messageHex = ethers.utils.hexlify(message).substring(2)

        const { payload } = await this._eth.ethereumSignMessage({ path: this.path, message: messageHex, hex: true})
        const { signature } = payload as MessageSignature
        return signature
    }

    async signTransaction(transaction: ethers.providers.TransactionRequest): Promise<string> {
        const tx = await ethers.utils.resolveProperties(transaction)

        tx.value = ethers.BigNumber.from(tx.value).toHexString()
        tx.gasLimit = ethers.BigNumber.from(tx.gasLimit).toHexString()
        tx.gasPrice = ethers.BigNumber.from(tx.gasPrice).toHexString()
        tx.nonce = ethers.BigNumber.from(tx.nonce).toHexString()

        const unsignedTx: EthereumTransaction = {
            to: tx.to as string,
            value: tx.value as string,
            data: tx.data as string | undefined,
            chainId: tx.chainId as number,
            nonce: tx.nonce as string,
            gasLimit: tx.gasLimit as string,
            gasPrice: tx.gasPrice as string,
        }

        const ethereumSignedTransaction = await this._eth.ethereumSignTransaction({ path: this.path, transaction: unsignedTx })
        const { payload } = ethereumSignedTransaction
        
        const signature = payload as EthereumSignedTx 
        const baseTx: ethers.utils.UnsignedTransaction = {
            ...unsignedTx,
            nonce: ethers.BigNumber.from(tx.nonce).toNumber(),
        }

        const signedTransaction = ethers.utils.serializeTransaction(baseTx, {
            v: ethers.BigNumber.from(signature.v).toNumber(),
            r: signature.r,
            s: signature.s,
        })
        return signedTransaction
    }

    async sendTransaction(transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>): Promise<ethers.providers.TransactionResponse> {
        this._checkProvider('sendTransaction')
        const tx = await this.populateTransaction(transaction)
        const signedTx = await this.signTransaction(tx)
        console.log('signedTx :>> ', signedTx)
        return await (this.provider as ethers.providers.JsonRpcProvider).sendTransaction(signedTx)
    }

    connect(provider: ethers.providers.Provider): ethers.Signer {
        const options = {
            provider,
            path: this.path
        }
        return new EthersTrezorSigner(options)
    }
}