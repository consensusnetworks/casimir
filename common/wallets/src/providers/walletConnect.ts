// import { EthereumProvider } from '@walletconnect/ethereum-provider'

import { Web3Modal } from "@web3modal/standalone"
import UniversalProvider from "@walletconnect/universal-provider"
import Client from "@walletconnect/sign-client"

import { ethers, providers, utils } from "ethers"
const DEFAULT_PROJECT_ID = "8e6877b49198d7a9f9561b8712805726"
const DEFAULT_RELAY_URL = "wss://relay.walletconnect.com"
const DEFAULT_LOGGER = "warn"

interface WalletAddressSignerOptions {
    provider?: ethers.providers.Provider
}

export class EthersWalletConnectSigner extends ethers.Signer {
    private _ethereumProvider: UniversalProvider
    private _web3Provider: providers.Web3Provider

    private constructor(
        options: WalletAddressSignerOptions, 
        ethereumProvider: UniversalProvider, 
        web3Provider: providers.Web3Provider
    ) {
        super()

        this._ethereumProvider = ethereumProvider
        this._web3Provider = web3Provider

        if (options.provider) {
            console.log("got to options.provider")
            ethers.utils.defineReadOnly(this, "provider", options.provider)
        } else {
            console.log("web3Provider in !options.provider :>> ", web3Provider)
            console.log("ethereumProvider :>> ", ethereumProvider)
            ethers.utils.defineReadOnly(this, "provider", web3Provider)
        }
    }

    static async create(options: WalletAddressSignerOptions): Promise<EthersWalletConnectSigner> {
        const ethereumProvider = await UniversalProvider.init({
            projectId: DEFAULT_PROJECT_ID,
            logger: DEFAULT_LOGGER,
            relayUrl: DEFAULT_RELAY_URL,
        })

        const web3Provider = new providers.Web3Provider(ethereumProvider)

        return new EthersWalletConnectSigner(options, ethereumProvider, web3Provider)
    }

    async getAddress(): Promise<string> {
        return "0x"
    }

    async signMessage(message: string | ethers.Bytes): Promise<string> {
        return "0x"
    }

    async signTransaction(tx: ethers.providers.TransactionRequest): Promise<string> {
        return "0x"
    }

    connect(provider: ethers.providers.Provider): ethers.Signer {
        return new EthersWalletConnectSigner()
    }
}

