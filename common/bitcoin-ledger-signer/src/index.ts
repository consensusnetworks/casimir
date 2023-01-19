import Btc from '@ledgerhq/hw-app-btc'
import useTransports from './providers/transports'
import { BitcoinLedgerSignerOptions } from './interfaces/BitcoinLedgerSignerOptions'

const defaultPath = '84\'/0\'/0\'/0/0' // Legacy addresses: '44\'/0\'/0\'/0/0', Segwit: '49\'/0\'/0\'/0/0', Native Segwit: '84\'/0\'/0\'/0/0'
const defaultType = 'usb'
const { createUSBTransport, createSpeculosTransport } = useTransports()
const transportCreators = {
    'usb': createUSBTransport,
    'speculos': createSpeculosTransport
}

export default class BitcoinLedgerSigner {
    readonly type: string
    readonly path: string
    readonly baseURL?: string
    _btc?: Promise<Btc>

    constructor(options: BitcoinLedgerSignerOptions) {

        if (!options.type) options.type = defaultType
        if (!options.path) options.path = defaultPath
        this.type = options.type
        this.path = options.path
        this.baseURL = options.baseURL

        const transportCreatorType = this.type as keyof typeof transportCreators
        const transportCreator = transportCreators[transportCreatorType]
        if (!transportCreator) console.log('Unknown or unsupported type', this.type)
        this._btc = transportCreator(this.baseURL).then(transport => {
            return new Btc({ transport })
        })
    }

    _retry<T = unknown>(callback: (btc: Btc) => Promise<T>, timeout?: number): Promise<T> {
        // The async-promise-executor is ok since _retry handles necessary errors 
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            const ledgerConnectionError = 'Please make sure Ledger is ready and retry'
            if (timeout && timeout > 0) {
                setTimeout(() => reject(new Error(ledgerConnectionError)), timeout)
            }

            const btc = await this._btc as Btc

            // Wait up to 5 seconds
            for (let i = 0; i < 50; i++) {
                try {
                    const result = await callback(btc)
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
        const { bitcoinAddress: address } = await this._retry((btc) => btc.getWalletPublicKey(
            this.path,
            { verify: false, format: 'bech32'}
        ))
        return address
    }

    // async signMessage(message) {

    // }

    // async signTransaction(transaction) {

    // }

    // Populates all fields in a transaction, signs it and sends it to the network
    // async sendTransaction(transaction) {

    // }

    // connect() {

    // }
}