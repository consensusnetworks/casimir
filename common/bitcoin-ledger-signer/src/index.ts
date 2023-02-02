import Btc from '@ledgerhq/hw-app-btc'
import useTransports from './providers/transports'
import { BitcoinLedgerSignerOptions } from './interfaces/BitcoinLedgerSignerOptions'
import { TransactionInit } from './interfaces/TransactionInit'

// const defaultPath = '84\'/0\'/0\'/0/0' // Legacy addresses: '44\'/0\'/0\'/0/0', Segwit: '49\'/0\'/0\'/0/0', Native Segwit: '84\'/0\'/0\'/0/0'
const defaultPath = '84\'/1\'/0\'/0/0' // TestNetPath
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
            // TODO: Add conditional for testnet
            return new Btc({ transport, currency: 'bitcoin_testnet' })
            return new Btc({ transport, currency: 'bitcoin' })
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
        // Pass testnet args to getWalletPublicKey
        const { bitcoinAddress: address } = await this._retry((btc) => btc.getWalletPublicKey(
            this.path,
            { verify: false, format: 'bech32'}
        ))
        return address
    }

    async signMessage(message: string): Promise<string> {
        try {
            const messageHex = Buffer.from(message).toString('hex')
            const result = await this._retry((btc) => btc.signMessage(
                this.path,
                messageHex
            ))
            const v = result['v'] + 27 + 4
            const signature = Buffer.from(v.toString(16) + result['r'] + result['s'], 'hex').toString('base64')
            console.log('Signature : ' + signature)
            return signature
        } catch (err) {
            console.log(err)
            throw err
        }
    }

    async signTransaction(path: string, transaction: any) {
    }

    async sendTransaction({from, to, value}: TransactionInit): Promise<string> {
        try {
        // Build the transaction object using splitTransaction to then pass into getTrustedInput
        // Create a transaction hex string
        const transactionHex = 'f85f49b51366f7150d2adea6544bc256743707a38e2bdfbf839349ba1ff2875c'
        const isSegwitSupported = false
        const tx = await this._retry(async (btc) => btc.splitTransaction(
            transactionHex,
            isSegwitSupported
        ))
        return new Promise(resolve => resolve(''))
        // const output_index = 1
        // const inputs = [[tx, output_index]]
        // Get trusted input (returns a string) using getTrustedInput
        // const trustedInput = await this._retry((btc) => btc.getTrustedInput(
        //     0,

        // ))
        
        // Build the CreateTransactionArg and pass it to createPaymentTransaction
        } catch (err) {
            console.log('Error in bitcoin-ledger-signer sendTransaction: ', err)
            throw err
        }
    }

    // connect() {

    // }
}