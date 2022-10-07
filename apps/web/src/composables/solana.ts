import { ref } from 'vue'
import {
    Connection,
    Transaction,
    SystemProgram,
    PublicKey,
} from '@solana/web3.js'
import { BrowserProviders } from '@/interfaces/BrowserProviders'
import { ProviderString } from '@/types/ProviderString'

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

    return { solanaProviderList, requestSolanaAddress }
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