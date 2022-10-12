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
import { MessageInit } from '@/interfaces/MessageInit'

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

  async function getSolanaAddress(provider: ProviderString) {
    const address = await requestSolanaAddress(provider as ProviderString)
    return address
  }

  async function sendSolanaTransaction({ from, to, value, providerString }: TransactionInit) {
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
    const { signature } = await availableProviders.value[providerString as keyof BrowserProviders]
      .signAndSendTransaction(transaction)
    const signatureStatus = await connection.getSignatureStatus(signature)
    return signatureStatus
  }

  async function signSolanaMessage(messageInit: MessageInit): Promise<string> {
    const { providerString, hashedMessage } = messageInit
    const { signature } = await availableProviders.value[providerString as keyof BrowserProviders]
      .signMessage(hashedMessage)
    return signature
  }

  return { solanaProviderList, getSolanaAddress, sendSolanaTransaction, signSolanaMessage }
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