import EthersTrezorSigner from '@casimir/ethers-trezor-signer'
import useEthers from '@/composables/ethers'
import useEnvironment from '@/composables/environment'
import { ethers } from 'ethers'
import { MessageInit } from '@/interfaces/MessageInit'
import { TransactionInit } from '@/interfaces/TransactionInit'

const trezorPath = 'm/44\'/60\'/0\'/0/0'

export default function useTrezor() {
    const { ethereumURL } = useEnvironment()
    const { getGasPriceAndLimit } = useEthers()

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

    async function sendTrezorTransaction({ from, to, value }: TransactionInit) {
        const signer = getEthersTrezorSigner()
        const provider = signer.provider as ethers.providers.Provider
        const { chainId } = await provider.getNetwork()
        const nonce = await provider.getTransactionCount(from)
        const unsignedTransaction = {
          to,
          data: '0x00',
          nonce,
          chainId,
          value: ethers.utils.parseUnits(value)
        } as ethers.UnsignedTransaction
        const { gasPrice, gasLimit } = await getGasPriceAndLimit(ethereumURL, unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
        unsignedTransaction.gasPrice = gasPrice
        unsignedTransaction.gasLimit = gasLimit

        // Todo check before click (user can +/- gas limit accordingly)
        const balance = await provider.getBalance(from)
        const required = gasPrice.mul(gasLimit).add(ethers.utils.parseEther(value))
        console.log('Balance', ethers.utils.formatEther(balance))
        console.log('Required', ethers.utils.formatEther(required))
        return await signer.sendTransaction(unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
    }

    async function signTrezorMessage(messageInit: MessageInit): Promise<string> {
        const { message } = messageInit
        const signer = getEthersTrezorSigner()
        return await signer.signMessage(message)
    }

    return { getEthersTrezorSigner, getTrezorAddress, sendTrezorTransaction, signTrezorMessage }
}