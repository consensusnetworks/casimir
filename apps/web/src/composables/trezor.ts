import { EthersTrezorSigner } from "@casimir/wallets"
import useSiwe from "@/composables/siwe"
import useEthers from "@/composables/ethers"
import useEnvironment from "@/composables/environment"
import { ethers } from "ethers"
import { LoginCredentials, MessageRequest, TransactionRequest } from "@casimir/types"

const { createSiweMessage, signInWithEthereum } = useSiwe()

export default function useTrezor() {
    const { ethereumUrl } = useEnvironment()
    const { getGasPriceAndLimit } = useEthers()

    function getEthersTrezorSigner(): EthersTrezorSigner {
        try {
            const options = {
                provider: new ethers.providers.JsonRpcProvider(ethereumUrl),
            }
            // This is working when Trezor Suite is not opened
            return new EthersTrezorSigner(options)
        } catch (error: any) {
            console.log(`Error in getEthersTrezorSigner: ${error}`)
            throw new Error(error)
        }
    }

    async function getEthersTrezorAddresses() {
        const signer = getEthersTrezorSigner()
        return await signer.getAddresses() // This error logs here: POST http://127.0.0.1:21325/ net::ERR_CONNECTION_REFUSED
    }

    async function loginWithTrezor(loginCredentials: LoginCredentials) {
        const { provider, address, currency, pathIndex } = loginCredentials
        try {
            const message = await createSiweMessage(address, "Sign in with Ethereum to the app.")
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
            data: "0x00",
            nonce,
            chainId,
            value: ethers.utils.parseUnits(value),
            type: 0
        } as ethers.UnsignedTransaction
        const { gasPrice, gasLimit } = 
      await getGasPriceAndLimit(ethereumUrl, unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
        unsignedTransaction.gasPrice = gasPrice
        unsignedTransaction.gasLimit = gasLimit

        // Todo check before click (user can +/- gas limit accordingly)
        const balance = await provider.getBalance(from)
        const required = gasPrice.mul(gasLimit).add(ethers.utils.parseEther(value))
        console.log("Balance", ethers.utils.formatEther(balance))
        console.log("Required", ethers.utils.formatEther(required))
        return await signer.sendTransaction(unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
    }

    async function signTrezorMessage(messageRequest: MessageRequest): Promise<string> {
        const { message } = messageRequest
        const signer = getEthersTrezorSigner()
        return await signer.signMessage(message)
    }

    return { 
        getEthersTrezorAddresses, 
        getEthersTrezorSigner, 
        loginWithTrezor, 
        sendTrezorTransaction, 
        signTrezorMessage
    }
}