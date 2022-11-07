import EthersTrezorSigner from '@casimir/ethers-trezor-signer'
import useEnvironment from '@/composables/environment'
import { ethers } from 'ethers'
import { MessageInit } from '@/interfaces/MessageInit'

const trezorPath = 'm/44\'/60\'/0\'/0/0'

export default function useTrezor() {
    const { ethereumURL } = useEnvironment()

    function getEthersTrezorSigner(): ethers.Signer {
        const options = {
            provider: new ethers.providers.JsonRpcProvider(ethereumURL),
            path: trezorPath
        }
        return new EthersTrezorSigner(options)
    }

    async function getTrezorAddress() {
        const signer = getEthersTrezorSigner()
        return await signer.getAddress()    
    }

    async function signTrezorMessage(messageInit: MessageInit): Promise<string> {
        const { message } = messageInit
        const signer = getEthersTrezorSigner()
        return await signer.signMessage(message)
      }

    return { getEthersTrezorSigner, getTrezorAddress, signTrezorMessage }
}