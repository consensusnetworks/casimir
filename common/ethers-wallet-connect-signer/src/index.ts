import { ethers } from 'ethers'
import WalletConnect from '@walletconnect/client'
import QRCodeModal from '@walletconnect/qrcode-modal'
import { EthersWalletConnectSignerOptions } from './interfaces/EthersWalletConnectSignerOptions'

export default class EthersWalletConnectSigner extends ethers.Signer {
    readonly baseURL?: string
    readonly _wc?: Promise<WalletConnect>

    constructor(options: EthersWalletConnectSignerOptions) {
        super()

        this.baseURL = options.baseURL

        // Override readonly provider for ethers.Signer
        if (options.provider) {
            ethers.utils.defineReadOnly(this, 'provider', options.provider)
        }

        const connector = new WalletConnect({
            bridge: this.baseURL,
            qrcodeModal: QRCodeModal
        })

        // Set readonly _wc to Promise<WalletConnect>
        ethers.utils.defineReadOnly(this, '_wc', connector.createSession().then(() => {
            return connector
        }))
    }

    _retry<T = unknown>(callback: (eth: WalletConnect) => Promise<T>, timeout?: number): Promise<T> {
        // The async-promise-executor is ok since _retry handles necessary errors 
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            const walletConnectConnectionError = 'Please make sure Wallet Connect is ready and retry'
            if (timeout && timeout > 0) {
                setTimeout(() => reject(new Error(walletConnectConnectionError)), timeout)
            }

            const wc = await this._wc as WalletConnect

            // Wait up to 5 seconds
            for (let i = 0; i < 50; i++) {
                try {
                    const result = await callback(wc)
                    return resolve(result)
                } catch (error) {
                    if ((error as { id: string }).id !== 'ConnectorLocked') {
                        return reject(error)
                    }
                }
                await new Promise((resolve) => {
                    setTimeout(resolve, 100)
                })
            }

            return reject(new Error(walletConnectConnectionError))
        })
    }

    async getAddress(): Promise<string> {
        const wc = await this._wc as WalletConnect
        return ethers.utils.getAddress(wc.accounts[0])
    }

    async signMessage(message: ethers.utils.Bytes | string): Promise<string> {
        const address = await this.getAddress()

        if (typeof(message) === 'string') {
            message = ethers.utils.toUtf8Bytes(message)
        }
        const messageHex = ethers.utils.hexlify(message).substring(2)

        const sig = await this._retry((wc) => wc.signPersonalMessage([messageHex, address]))
        sig.r = '0x' + sig.r
        sig.s = '0x' + sig.s
        return ethers.utils.joinSignature(sig)
    }

    async signTransaction(transaction: ethers.providers.TransactionRequest): Promise<string> {
        const tx = await ethers.utils.resolveProperties(transaction)

        const address = await this.getAddress()

        const baseTx = {
            from: address,
            to: tx.to || undefined,
            data: tx.data as string || undefined,
            gasLimit: ethers.utils.hexlify(tx.gasLimit as ethers.BigNumber) || undefined,
            gasPrice: ethers.utils.hexlify(tx.gasPrice as ethers.BigNumber) || undefined,
            nonce: tx.nonce as number || undefined,
            value: ethers.utils.hexlify(tx.value as ethers.BigNumber) || undefined,
        }

        const sig = await this._retry((wc) => wc.signTransaction(baseTx))

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
            baseURL: this.baseURL
        }
        return new EthersWalletConnectSigner(options)
    }
}