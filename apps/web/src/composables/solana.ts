import { ref } from 'vue'
import {
    Connection,
    Transaction,
    SystemProgram,
    PublicKey,
} from '@solana/web3.js'
import { BrowserProviders } from '@/interfaces/BrowserProviders'
import { ProviderString } from '@/types/ProviderString'
import { TransactionInit } from '@/interfaces/TransactionInit'

const defaultProviders = {
    Phantom: undefined,
}

export default function useSolana() {
    const solanaProviderList = ['Phantom']
    const availableProviders = ref<BrowserProviders>(getBrowserProviders())
    const solanaPublicKey = ref({})

    async function requestSolanaAddress(provider: ProviderString) {
        const phantomProvider =
          availableProviders.value[provider as keyof BrowserProviders]
        const resp = await phantomProvider.connect()
        solanaPublicKey.value = resp.publicKey
        const address = resp.publicKey.toString()
        return address
    }

    async function sendSolanaTransaction(provider: ProviderString, { from, to, value }: TransactionInit) {
        const network = 'https://api.devnet.solana.com'
        const connection = new Connection(network)
        const { blockhash } = await connection.getLatestBlockhash('finalized')
        const toAddress = new PublicKey(to)
        const fromAddress = new PublicKey(from)
        const lamports = Number(value) * 1000000000
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromAddress,
            toPubkey: toAddress,
            lamports,
          })
        )
        transaction.feePayer = fromAddress
        transaction.recentBlockhash = blockhash
        const { signature } = await availableProviders.value[provider as keyof BrowserProviders]
            .signAndSendTransaction(transaction)
        const signatureStatus = await connection.getSignatureStatus(signature)
        return signatureStatus
    }

    async function signSolanaMessage(provider: ProviderString, message: string) {
        const { signature } = await availableProviders.value[provider as keyof BrowserProviders]
            .signMessage(message)
        return signature
    }

    return { solanaProviderList, requestSolanaAddress, sendSolanaTransaction, signSolanaMessage }
}

function getBrowserProviders() {
    const phantom: any = window.phantom?.solana?.isPhantom
      ? window.phantom?.solana
      : undefined
    const providers = {
      Phantom: undefined,
    }
    providers.Phantom = phantom
    return providers
}