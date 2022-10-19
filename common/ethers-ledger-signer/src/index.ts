import { ethers } from 'ethers'
import { TransactionRequest, TransactionResponse } from '@ethersproject/abstract-provider'
import Eth from '@ledgerhq/hw-app-eth'
import useTransports from './providers/transports'
import { EthersLedgerSignerOptions } from './interfaces/EthersLedgerSignerOptions'

const defaultPath = '44\'/60\'/0\'/0/0'
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
        ethers.utils.defineReadOnly(this, 'provider', options.provider)

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
            const ledgerConnectionError = 'Please connect Ledger and retry'
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
        const account = await this._retry((eth) => eth.getAddress(this.path))
        return ethers.utils.getAddress(account.address)
    }

    async signMessage(message: ethers.utils.Bytes | string): Promise<string> {
        if (typeof(message) === 'string') {
            message = ethers.utils.toUtf8Bytes(message)
        }

        const messageHex = ethers.utils.hexlify(message).substring(2)

        const sig = await this._retry((eth) => eth.signPersonalMessage(this.path, messageHex))
        sig.r = '0x' + sig.r
        sig.s = '0x' + sig.s
        return ethers.utils.joinSignature(sig)
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
        }

        const unsignedTx = ethers.utils.serializeTransaction(baseTx).substring(2)
        const sig = await this._retry((eth) => eth.signTransaction(this.path, unsignedTx))

        console.log('Signed tx', tx)

        return ethers.utils.serializeTransaction(baseTx, {
            v: ethers.BigNumber.from('0x' + sig.v).toNumber(),
            r: ('0x' + sig.r),
            s: ('0x' + sig.s),
        })
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