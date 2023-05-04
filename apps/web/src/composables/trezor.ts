import { EthersTrezorSigner } from '@casimir/wallets'
import useAuth from '@/composables/auth'
import useEthers from '@/composables/ethers'
import useEnvironment from '@/composables/environment'
import { ethers } from 'ethers'
import { MessageInit, TransactionInit } from '@/interfaces/index'
import { LoginCredentials } from '@casimir/types'

const { createSiweMessage, signInWithEthereum } = useAuth()

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

    async function getTrezorAddresses() {
        const signer = getEthersTrezorSigner()
        return await signer.getAddresses()
    }

    async function loginWithTrezor(loginCredentials: LoginCredentials, pathIndex: string) {
        const { provider, address, currency } = loginCredentials
        try {
            const message = await createSiweMessage(address, 'Sign in with Ethereum to the app.')
            const signer = getEthersTrezorSigner()
            const signedMessage = await signer.signMessageWithIndex(message, pathIndex)
            const loginResponse = await signInWithEthereum({ 
                address, 
                currency,
                message, 
                provider, 
                signedMessage
            })
            return await loginResponse.json()
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
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
          value: ethers.utils.parseUnits(value),
          type: 0
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

    return { getEthersTrezorSigner, getTrezorAddress, getTrezorAddresses, loginWithTrezor, sendTrezorTransaction, signTrezorMessage }
}