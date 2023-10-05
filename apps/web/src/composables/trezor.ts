import { EthersTrezorSigner } from '@casimir/wallets'
import useSiwe from '@/composables/siwe'
import useEthers from '@/composables/ethers'
import useEnvironment from '@/composables/environment'
import { ethers } from 'ethers'
import { LoginCredentials, MessageRequest, TransactionRequest } from '@casimir/types'

const { createSiweMessage, signInWithEthereum } = useSiwe()

const trezorPath = 'm/44\'/60\'/0\'/0/0'

export default function useTrezor() {
    const { ethereumUrl } = useEnvironment()
    const { getGasPriceAndLimit } = useEthers()

    // TODO: Implement this:
    function getBitcoinTrezorSigner() {
        return alert('Not implemented yet')
        // const options = {
        //     path: trezorPath
        // }
        // return new BitcoinTrezorSigner(options)
    }

    function getEthersTrezorSigner(): EthersTrezorSigner {
        const options = {
            provider: new ethers.providers.JsonRpcProvider(ethereumUrl),
            path: trezorPath
        }
        return new EthersTrezorSigner(options)
    }

    const getTrezorAddress = {
        'BTC': () => {
            return new Promise((resolve, reject) => {
                console.log('BTC is not yet supported on Trezor')
                resolve('BTC is not yet supported on Trezor')
            }) as Promise<string>
        },
        'ETH': getEthersTrezorAddresses,
        'IOTX': () => {
            return new Promise((resolve, reject) => {
                console.log('IOTX is not yet supported on Trezor')
                resolve('IOTX is not yet supported on Trezor')
            }) as Promise<string>
        },
        'SOL': () => {
            return new Promise((resolve, reject) => {
                console.log('SOL is not yet supported on Trezor')
                resolve('SOL is not yet supported on Trezor')
            }) as Promise<string>
        },
        '': () => {
            return new Promise((resolve, reject) => {
                console.log('No currency selected')
                resolve('No currency selected')
            }) as Promise<string>
        },
        'USD': () => {
            return new Promise((resolve, reject) => {
                console.log('USD is not yet supported on Trezor')
                resolve('USD is not yet supported on Trezor')
            }) as Promise<string>
        }
    }

    async function getEthersTrezorAddresses() {
        const signer = getEthersTrezorSigner()
        return await signer.getAddresses()
    }

    async function loginWithTrezor(loginCredentials: LoginCredentials) {
        const { provider, address, currency, pathIndex } = loginCredentials
        try {
            const message = await createSiweMessage(address, 'Sign in with Ethereum to the app.')
            const signer = getEthersTrezorSigner()
            const signedMessage = await signer.signMessageWithIndex(message, pathIndex as number)
            await signInWithEthereum({ 
                address, 
                currency,
                message, 
                provider, 
                signedMessage
            })
        } catch (error: any) {
            console.log(error)
            throw new Error(error)
        }
    }

    async function sendTrezorTransaction({ from, to, value }: TransactionRequest) {
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
        const { gasPrice, gasLimit } = await getGasPriceAndLimit(ethereumUrl, unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
        unsignedTransaction.gasPrice = gasPrice
        unsignedTransaction.gasLimit = gasLimit

        // Todo check before click (user can +/- gas limit accordingly)
        const balance = await provider.getBalance(from)
        const required = gasPrice.mul(gasLimit).add(ethers.utils.parseEther(value))
        console.log('Balance', ethers.utils.formatEther(balance))
        console.log('Required', ethers.utils.formatEther(required))
        return await signer.sendTransaction(unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
    }

    async function signTrezorMessage(messageRequest: MessageRequest): Promise<string> {
        const { message } = messageRequest
        const signer = getEthersTrezorSigner()
        return await signer.signMessage(message)
    }

    return { 
        getEthersTrezorSigner, 
        getTrezorAddress, 
        loginWithTrezor, 
        sendTrezorTransaction, 
        signTrezorMessage
    }
}