import { ethers } from 'ethers'
import TrezorConnect, { Address, EthereumTransaction, EthereumSignedTx } from '@trezor/connect-web'

export interface TrezorMessageSignature {
    address: string
    signature: string
}

export interface TrezorSignerOptions {
    provider?: ethers.providers.Provider
    path?: string
}

TrezorConnect.manifest({ email: 'support@consensusnetworks.com', appUrl: 'casimir.co' })

export class EthersTrezorSigner extends ethers.Signer {
    readonly path: string = 'm/44\'/60\'/0\'/0/0'
    readonly eth = TrezorConnect

    constructor(options: TrezorSignerOptions) {
        super()

        /** Override readonly wallet path */
        if (options.path) this.path = options.path
        
        // Override readonly provider for ethers.Signer
        if (options.provider) {
            ethers.utils.defineReadOnly(this, 'provider', options.provider)
        }

    }

    async getAddress(): Promise<string> {
        const { payload } = await this.eth.ethereumGetAddress({ path: this.path })
        const { address } = payload as Address
        return ethers.utils.getAddress(address)
    }

    async signMessage(message: ethers.utils.Bytes | string): Promise<string> {
        if (typeof(message) === 'string') {
            message = ethers.utils.toUtf8Bytes(message)
        }
        const messageHex = ethers.utils.hexlify(message).substring(2)

        const { payload } = await this.eth.ethereumSignMessage({ path: this.path, message: messageHex, hex: true})
        const { signature } = payload as TrezorMessageSignature
        return signature
    }

    async signTransaction(transaction: ethers.providers.TransactionRequest): Promise<string> {
        transaction.value = ethers.BigNumber.from(transaction.value).toHexString()
        transaction.gasLimit = ethers.BigNumber.from(transaction.gasLimit).toHexString()
        transaction.gasPrice = ethers.BigNumber.from(transaction.gasPrice).toHexString()
        transaction.nonce = ethers.BigNumber.from(transaction.nonce).toHexString()

        const unsignedTx: EthereumTransaction = {
            to: transaction.to as string,
            value: transaction.value as string,
            data: transaction.data as string | undefined,
            chainId: transaction.chainId as number,
            nonce: transaction.nonce as string,
            gasLimit: transaction.gasLimit as string,
            gasPrice: transaction.gasPrice as string,
            // Todo fix type
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            type: transaction.type as number
        }

        const ethereumSignedTransaction = await this.eth.ethereumSignTransaction({ path: this.path, transaction: unsignedTx })
        const { payload } = ethereumSignedTransaction
        
        const signature = payload as EthereumSignedTx 
        const baseTx: ethers.utils.UnsignedTransaction = {
            ...unsignedTx,
            nonce: ethers.BigNumber.from(transaction.nonce).toNumber(),
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
        
        transaction.gasLimit = await this?.provider?.estimateGas(transaction)
        transaction.gasPrice = await this?.provider?.getGasPrice()
        transaction.nonce = await this?.provider?.getTransactionCount(await this.getAddress())
        transaction.chainId = 1337

        const signedTx = await this.signTransaction(transaction as ethers.providers.TransactionRequest)
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