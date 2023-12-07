/* eslint-disable max-len */
import { ethers } from "ethers"
// import Btc from '@ledgerhq/hw-app-btc'
import Eth, { ledgerService } from "@ledgerhq/hw-app-eth"
import Transport from "@ledgerhq/hw-transport"
import TransportWebUSB from "@ledgerhq/hw-transport-webusb"
import { CryptoAddress } from "@casimir/types"

const transports = {
    "usb": async function createUSBTransport(): Promise<Transport> {
        return await TransportWebUSB.create()
    }
}

export interface LedgerSignerOptions {
    provider?: ethers.providers.Provider
    type?: string
    path?: string
    baseURL?: string
}

// export class BitcoinLedgerSigner {
//     readonly type: string = 'usb'
//     readonly path: string = '84\'/0\'/0\'/0/0'
//     readonly baseURL?: string
//     btc?: Promise<Btc>

//     constructor(options: LedgerSignerOptions) {
//         if (options.type) this.type = options.type
//         if (options.path) this.path = options.path
//         this.baseURL = options.baseURL

//         const transportCreatorType = this.type as keyof typeof transports
//         const transportCreator = transports[transportCreatorType]
//         if (!transportCreator) console.log('Unknown or unsupported type', this.type)
//         this.btc = transportCreator(this.baseURL).then(transport => {
//             // TODO: Add conditional for testnet
//             return new Btc({ transport, currency: 'bitcoin_testnet' })
//             // return new Btc({ transport, currency: 'bitcoin' })
//         })
//     }

//     retry<T = unknown>(callback: (btc: Btc) => Promise<T>, timeout?: number): Promise<T> {
//         // The async-promise-executor is ok since retry handles necessary errors 
//         // eslint-disable-next-line no-async-promise-executor
//         return new Promise(async (resolve, reject) => {
//             const ledgerConnectionError = 'Please make sure Ledger is ready and retry'
//             if (timeout && timeout > 0) {
//                 setTimeout(() => reject(new Error(ledgerConnectionError)), timeout)
//             }

//             const btc = await this.btc as Btc

//             // Wait up to 5 seconds
//             for (let i = 0; i < 50; i++) {
//                 try {
//                     const result = await callback(btc)
//                     return resolve(result)
//                 } catch (error) {
//                     if ((error as { id: string }).id !== 'TransportLocked') {
//                         return reject(error)
//                     }
//                 }
//                 await new Promise((resolve) => {
//                     setTimeout(resolve, 100)
//                 })
//             }

//             return reject(new Error(ledgerConnectionError))
//         })
//     }

//     async getAddress(): Promise<string> {
//         const { bitcoinAddress: address } = await this.retry((btc) => btc.getWalletPublicKey(
//             this.path,
//             { verify: false, format: 'bech32' }
//         ))
//         return address
//     }

//     async signMessage(message: string): Promise<string> {
//         try {
//             const messageHex = Buffer.from(message).toString('hex')
//             const result = await this.retry((btc) => btc.signMessage(
//                 this.path,
//                 messageHex
//             ))
//             const v = result['v'] + 27 + 4
//             const signature = Buffer.from(v.toString(16) + result['r'] + result['s'], 'hex').toString('base64')
//             console.log('Signature : ' + signature)
//             return signature
//         } catch (err) {
//             console.log(err)
//             throw err
//         }
//     }

//     // async signTransaction(path: string, transaction: any) {
//     // }

//     async sendTransaction({ from, to, value }: TransactionRequest): Promise<string> {
//         // Build the transaction object using splitTransaction to then pass into getTrustedInput
//         // Create a transaction hex string
//         const transactionHex = 'f85f49b51366f7150d2adea6544bc256743707a38e2bdfbf839349ba1ff2875c'
//         const isSegwitSupported = false
//         const tx = await this.retry(async (btc) => btc.splitTransaction(
//             transactionHex,
//             isSegwitSupported
//         ))
//         return new Promise(resolve => resolve(''))
//         // const output_index = 1
//         // const inputs = [[tx, output_index]]
//         // Get trusted input (returns a string) using getTrustedInput
//         // const trustedInput = await this.retry((btc) => btc.getTrustedInput(
//         //     0,

//         // ))

//         // Build the CreateTransactionArg and pass it to createPaymentTransaction
//     }
// }

export class EthersLedgerSigner extends ethers.Signer {
    readonly type: string = "usb"
    readonly path: string = "m/44'/60'/0'/0/0"
    readonly eth?: Promise<Eth>

    constructor(options: LedgerSignerOptions) {
        super()

        if (options.type) this.type = options.type
        if (options.path) this.path = options.path        

        // Override readonly provider for ethers.Signer
        if (options.provider) {
            ethers.utils.defineReadOnly(this, "provider", options.provider)
        }

        // Set readonly eth to Promise<Eth>
        const transportCreatorType = this.type as keyof typeof transports
        const transportCreator = transports[transportCreatorType]
        if (!transportCreator) console.log("Unknown or unsupported type", this.type)
        ethers.utils.defineReadOnly(this, "eth", transportCreator().then(transport => {
            return new Eth(transport)
        }))
    }

    retry<T = unknown>(callback: (eth: Eth) => Promise<T>, timeout?: number): Promise<T> {
    // The async-promise-executor is ok since retry handles necessary errors 
    // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            const ledgerConnectionError = "Please make sure Ledger is ready and retry"
            if (timeout && timeout > 0) {
                setTimeout(() => reject(new Error(ledgerConnectionError)), timeout)
            }

            const eth = await this.eth as Eth

            // Wait up to 5 seconds
            for (let i = 0; i < 50; i++) {
                try {
                    const result = await callback(eth)
                    return resolve(result)
                } catch (error) {
                    if ((error as { id: string }).id !== "TransportLocked") {
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

    async getAddresses(): Promise<Array<CryptoAddress> | null> {
        const ledgerAddresses = []
        
        for (let i = 0; i < 5; i++) {
            // m/coin_type'/account_index'/external_chain_index'/address_index/change_index
            const path = `m/44'/60'/${i}'/0/0`
            const { address } = await this.retry((eth) => eth.getAddress(path))
            // TODO: Replace with our own provider depending on environment
            const provider = new ethers.providers.JsonRpcProvider("https://goerli.infura.io/v3/4e8acb4e58bb4cb9978ac4a22f3326a7")
            const balance = await provider.getBalance(address)
            const ethBalance = ethers.utils.formatEther(balance)
            if (parseFloat(ethBalance) > 0) 
                ledgerAddresses.push({ address, balance: ethBalance, pathIndex: i.toString() })
        }
        return ledgerAddresses.length ? ledgerAddresses : null
    }

    async getAddress(): Promise<string> {
        const { address } = await this.retry((eth) => eth.getAddress(this.path))
        return address
    }

    async signMessage(message: ethers.utils.Bytes | string): Promise<string> {
        if (typeof (message) === "string") {
            message = ethers.utils.toUtf8Bytes(message)
        }
        const messageHex = ethers.utils.hexlify(message).substring(2)
        const testPath = "m/44'/60'/1'/0/0"
        const signature = await this.retry((eth) => eth.signPersonalMessage(testPath, messageHex))
        signature.r = "0x" + signature.r
        signature.s = "0x" + signature.s
        return ethers.utils.joinSignature(signature)
    }
    
    async signMessageWithIndex(message: ethers.utils.Bytes | string, pathIndex: number): Promise<string> {
        if (typeof (message) === "string") {
            console.log("message :>> ", message)
            message = ethers.utils.toUtf8Bytes(message)
        }
        const messageHex = ethers.utils.hexlify(message).substring(2)
        const path = `m/44'/60'/${pathIndex}'/0/0`
        const signature = await this.retry((eth) => eth.signPersonalMessage(path, messageHex))
        console.log("signature :>> ", signature)
        signature.r = "0x" + signature.r
        signature.s = "0x" + signature.s
        console.log("signature :>> ", signature)
        return ethers.utils.joinSignature(signature)
    }

    async signTransaction(tx: ethers.providers.TransactionRequest): Promise<string> {
        const resolvedTx = await ethers.utils.resolveProperties(tx)
        
        const baseTx: ethers.utils.UnsignedTransaction = {
            chainId: (resolvedTx.chainId || 1),
            data: (resolvedTx.data || undefined),
            gasLimit: (resolvedTx.gasLimit || undefined),
            maxFeePerGas: (resolvedTx.maxFeePerGas || undefined),
            maxPriorityFeePerGas: (resolvedTx.maxPriorityFeePerGas || undefined),
            nonce: (resolvedTx.nonce ? ethers.BigNumber.from(resolvedTx.nonce).toNumber() : 0),
            to: (resolvedTx.to || undefined),
            value: (resolvedTx.value || undefined),
            type: (resolvedTx.type || undefined)
        }
    
        const unsignedTx = ethers.utils.serializeTransaction(baseTx).substring(2) // Do we have to do this step?
        const resolution = await ledgerService.resolveTransaction(unsignedTx, {}, {})
        const signature = await this.retry((eth) => eth.signTransaction(this.path, unsignedTx, resolution))
    
        const result = ethers.utils.serializeTransaction(baseTx, {
            v: ethers.BigNumber.from("0x" + signature.v).toNumber(),
            r: ("0x" + signature.r),
            s: ("0x" + signature.s),
        })
        return result
    }

    // Populates all fields in a transaction, signs it and sends it to the network
    async sendTransaction(tx: ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
        : Promise<ethers.providers.TransactionResponse> 
    {
        this._checkProvider("sendTransaction")
        const populatedTx = await this.populateTransaction(tx)
        const signedTx = await this.signTransaction(populatedTx)
        const result = await (this.provider as ethers.providers.JsonRpcProvider).sendTransaction(signedTx)
        return result
    }

    connect(provider: ethers.providers.Provider): ethers.Signer {
        const options = {
            provider,
            type: this.type,
            path: this.path
        }
        return new EthersLedgerSigner(options)
    }
}