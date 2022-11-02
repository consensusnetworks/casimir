import EthersTrezorSigner from '@casimir/ethers-trezor-signer'
import useEnvironment from '@/composables/environment'
import { ethers } from 'ethers'

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

    return { getEthersTrezorSigner, getTrezorAddress }
}