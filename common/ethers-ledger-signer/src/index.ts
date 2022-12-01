import { ethers } from 'ethers'
import Eth, { ledgerService } from '@ledgerhq/hw-app-eth'
import useTransports from './providers/transports'
import { EthersLedgerSignerOptions } from './interfaces/EthersLedgerSignerOptions'

const defaultPath = 'm/44\'/60\'/0\'/0/0'
const defaultType = 'usb'
const { createUSBTransport, createSpeculosTransport } = useTransports()
const transportCreators = {
    'usb': createUSBTransport,
    'speculos': createSpeculosTransport
}

export default class EthersLedgerSigner extends ethers.Signer {
    readonly type: string
    readonly path: string
    readonly baseURL?: string
    readonly _eth?: Promise<Eth>

    constructor(options: EthersLedgerSignerOptions) {
        super()

        if (!options.type) options.type = defaultType
        if (!options.path) options.path = defaultPath
        this.type = options.type
        this.path = options.path
        this.baseURL = options.baseURL

        // Override readonly provider for ethers.Signer
        if (options.provider) {
            ethers.utils.defineReadOnly(this, 'provider', options.provider)
        }

        // Set readonly _eth to Promise<Eth>
        const transportCreatorType = this.type as keyof typeof transportCreators
        const transportCreator = transportCreators[transportCreatorType]
        if (!transportCreator) console.log('Unknown or unsupported type', this.type)
        ethers.utils.defineReadOnly(this, '_eth', transportCreator(this.baseURL).then(transport => {
            return new Eth(transport)
        }))
    }

    _retry<T = unknown>(callback: (eth: Eth) => Promise<T>, timeout?: number): Promise<T> {
        // The async-promise-executor is ok since _retry handles necessary errors 
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            const ledgerConnectionError = 'Please make sure Ledger is ready and retry'
            if (timeout && timeout > 0) {
                setTimeout(() => reject(new Error(ledgerConnectionError)), timeout)
            }

            const eth = await this._eth as Eth

            // Wait up to 5 seconds
            for (let i = 0; i < 50; i++) {
                try {
                    const result = await callback(eth)
                    return resolve(result)
                } catch (error) {
                    if ((error as { id: string }).id !== 'TransportLocked') {
                        return reject(error)
                    }
                }
                await new Promise((resolve) => {
                    setTimeout(resolve, 100)
                })
            }

            return reject(new Error(ledgerConnectionError))
        })
    }

    async getAddress(): Promise<string> {
        const { address } = await this._retry((eth) => eth.getAddress(this.path))
        return ethers.utils.getAddress(address)
    }

    async signMessage(message: ethers.utils.Bytes | string): Promise<string> {
        if (typeof (message) === 'string') {
            message = ethers.utils.toUtf8Bytes(message)
        }
        const messageHex = ethers.utils.hexlify(message).substring(2)

        const signature = await this._retry((eth) => eth.signPersonalMessage(this.path, messageHex))
        signature.r = '0x' + signature.r
        signature.s = '0x' + signature.s
        return ethers.utils.joinSignature(signature)
    }

    async signTransaction(transaction: ethers.providers.TransactionRequest): Promise<string> {
        const tx = await ethers.utils.resolveProperties(transaction)
        const baseTx: ethers.utils.UnsignedTransaction = {
            chainId: (tx.chainId || undefined),
            data: (tx.data || undefined),
            gasLimit: (tx.gasLimit || undefined),
            gasPrice: (tx.gasPrice || undefined),
            nonce: (tx.nonce ? ethers.BigNumber.from(tx.nonce).toNumber(): undefined),
            to: (tx.to || undefined),
            value: (tx.value || undefined),
            type: (tx.type || undefined)
        }

        const unsignedTx = ethers.utils.serializeTransaction(baseTx).substring(2)
        const resolution = await ledgerService.resolveTransaction(unsignedTx, {}, {})
        const signature = await this._retry((eth) => eth.signTransaction(this.path, unsignedTx, resolution))

        return ethers.utils.serializeTransaction(baseTx, {
            v: ethers.BigNumber.from('0x' + signature.v).toNumber(),
            r: ('0x' + signature.r),
            s: ('0x' + signature.s),
        })
    }

    // Populates all fields in a transaction, signs it and sends it to the network
    async sendTransaction(transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>): Promise<ethers.providers.TransactionResponse> {
        this._checkProvider('sendTransaction')
        const tx = await this.populateTransaction(transaction)
        const signedTx = await this.signTransaction(tx)
        return await (this.provider as ethers.providers.JsonRpcProvider).sendTransaction(signedTx)
    }

    connect(provider: ethers.providers.Provider): ethers.Signer {
        const options = {
            provider,
            type: this.type,
            path: this.path,
            baseURL: this.baseURL
        }
        return new EthersLedgerSigner(options)
    }
}