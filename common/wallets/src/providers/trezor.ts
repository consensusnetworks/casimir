import { ethers } from "ethers"
import TrezorConnect, { Address, EthereumTransaction, EthereumSignedTx } from "@trezor/connect-web"
import { CryptoAddress } from "@casimir/types"

export interface TrezorMessageSignature {
    address: string
    signature: string
}

export interface TrezorSignerOptions {
    provider?: ethers.providers.Provider
    path?: string
}

TrezorConnect.manifest({ email: "support@consensusnetworks.com", appUrl: "casimir.co" })

export class EthersTrezorSigner extends ethers.Signer {
    readonly path: string = "m/44'/60'/0'/0/0"
    readonly eth = TrezorConnect

    constructor(options: TrezorSignerOptions) {
        super()

        /** Override readonly wallet path */
        if (options.path) this.path = options.path
        
        // Override readonly provider for ethers.Signer
        if (options.provider) {
            ethers.utils.defineReadOnly(this, "provider", options.provider)
        }

    }

    async getAddress(): Promise<string> {
        const { payload } = await this.eth.ethereumGetAddress({ path: this.path, showOnTrezor: false })
        const { address } = payload as Address
        return ethers.utils.getAddress(address)
    }

    async getAddresses(): Promise<Array<CryptoAddress>> {
        const trezorAddresses = []
        const bundle = []
        for (let i = 0; i < 2; i++) {
            const path = `m/44'/60'/0'/0/${i}`
            bundle.push({ path, showOnTrezor: false })
        }
        const { payload } = await this.eth.ethereumGetAddress({ bundle }) as any
        if (payload.error) {
            if (payload.code === "Transport_Missing") {
                throw new Error("Trezor Suite is not open")
            } else if (payload.error === "session not found") {
                throw new Error("There was an error connecting to Trezor. Please try again.")
            } else {
                throw new Error(`Error from Trezor: ${payload.error}`)
            }
        }
    
        for (let i = 0; i < payload.length; i++) {
            const { address } = payload[i]
            const provider = new ethers.providers.JsonRpcProvider("https://goerli.infura.io/v3/4e8acb4e58bb4cb9978ac4a22f3326a7")
            const modifiedAddress = address.toLowerCase().trim()
            const balance = await provider.getBalance(modifiedAddress)
            const ethBalance = ethers.utils.formatEther(balance)
            trezorAddresses.push({ address, balance: ethBalance, pathIndex: i.toString() })
        }
        return trezorAddresses.length ? trezorAddresses : []
    }

    async signMessage(message: ethers.utils.Bytes | string): Promise<string> {
        if (typeof(message) === "string") message = ethers.utils.toUtf8Bytes(message)
        const messageHex = ethers.utils.hexlify(message).substring(2)
        const { payload } = await this.eth.ethereumSignMessage({ path: this.path, message: messageHex, hex: true })
        const { signature } = payload as TrezorMessageSignature
        return signature
    }

    async signMessageWithIndex(message: ethers.utils.Bytes | string, pathIndex: number): Promise<string> {
        if (typeof (message) === "string") message = ethers.utils.toUtf8Bytes(message)
        const messageHex = ethers.utils.hexlify(message).substring(2)
        const path = `m/44'/60'/${pathIndex}'/0/0`
        const { payload } = await this.eth.ethereumSignMessage({ path, message: messageHex, hex: true })
        const { signature } = payload as TrezorMessageSignature
        const convertedSignature = convertSignature(signature)
        return convertedSignature
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

        const ethereumSignedTransaction = await this.eth.ethereumSignTransaction(
            { path: this.path, transaction: unsignedTx }
        )
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

    async sendTransaction(transaction: ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
        : Promise<ethers.providers.TransactionResponse> 
    {
        this._checkProvider("sendTransaction")
        
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

function convertSignature(signature: string): string {
    const r = "0x" + signature.slice(0, 64)
    const s = "0x" + signature.slice(64, 128)
    const v = parseInt("0x" + signature.slice(128, 130), 16)
    return ethers.utils.joinSignature({ r, s, v })
}