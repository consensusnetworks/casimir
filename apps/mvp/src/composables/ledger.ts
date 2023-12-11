import { /*BitcoinLedgerSigner, */EthersLedgerSigner } from "@casimir/wallets"
import { ethers } from "ethers"
import { MessageRequest, TransactionRequest } from "@casimir/types"
import { CryptoAddress, LoginCredentials } from "@casimir/types"
import useEnvironment from "@/composables/environment"
import useEthers from "@/composables/ethers"
import useSiwe from "@/composables/siwe"

const { createSiweMessage, signInWithEthereum } = useSiwe()

export default function useLedger() {
    const { ethereumUrl, ledgerType, speculosUrl } = useEnvironment()
    const { getGasPriceAndLimit } = useEthers()

    function getEthersLedgerSigner(pathIndex?: number) {
        const path = pathIndex ? `m/44'/60'/${pathIndex}'/0/0` : "m/44'/60'/0'/0/0"
        const options = {
            provider: new ethers.providers.JsonRpcProvider(ethereumUrl),
            type: ledgerType,
            baseURL: speculosUrl,
            path
        }
        return new EthersLedgerSigner(options)
    }

    async function getEthersLedgerAddresses(): Promise<Array<CryptoAddress>> {
        const signer = getEthersLedgerSigner()
        return await signer.getAddresses() as Array<CryptoAddress>
    }

    async function loginWithLedger(loginCredentials: LoginCredentials) {
        // ETH Mainnet: 0x8222ef172a2117d1c4739e35234e097630d94376
        // ETH Goerli 1: 0x8222Ef172A2117D1C4739E35234E097630D94376
        // ETH Goerli 2: 0x8ed535c94DC22218D74A77593228cbb1B7FF6D13
        // Derivation path m/44\'/60\'/0\'/0/1: 0x1a16ae0F5cf84CaE346a1D586d00366bBA69bccc
        const { provider, address, currency, pathIndex } = loginCredentials
        try {
            const message = await createSiweMessage(address, "Sign in with Ethereum to the app.")
            const signer = getEthersLedgerSigner(pathIndex)
            const signedMessage = await signer.signMessageWithIndex(message, pathIndex as number)
            await signInWithEthereum({ 
                address, 
                currency,
                message, 
                provider, 
                signedMessage,
                pathIndex
            })
        } catch (err) {
            console.log("Error logging in: ", err)
            return err
        }
    }

    async function sendLedgerTransaction({ from, to, value, currency }: TransactionRequest) {
        if (currency === "ETH") {
            const signer = getEthersLedgerSigner()
            const provider = signer.provider as ethers.providers.Provider
            const unsignedTransaction = {
                to,
                value: ethers.utils.parseUnits(value),
                type: 0
            } as ethers.UnsignedTransaction
      
            // Todo check before click (user can +/- gas limit accordingly)
            const { gasPrice, gasLimit } = 
        await getGasPriceAndLimit(ethereumUrl, unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
            const balance = await provider.getBalance(from)
            const required = gasPrice.mul(gasLimit).add(ethers.utils.parseEther(value))
            console.log("Balance", ethers.utils.formatEther(balance))
            console.log("Required", ethers.utils.formatEther(required))
  
            return await signer.sendTransaction(unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
        }/* else if (currency === 'BTC') {
      alert('Send transaction not yet implemented for BTC')
    }*/
    }

    async function signLedgerMessage(messageRequest: MessageRequest): Promise<string> {
        if (messageRequest.currency === "ETH") {
            const { message } = messageRequest
            const signer = getEthersLedgerSigner()
            return await signer.signMessage(message)
        } else {
            return ""
        }
    }

    return {
        getEthersLedgerAddresses,
        getEthersLedgerSigner,
        loginWithLedger,
        signLedgerMessage,
        sendLedgerTransaction,
    }
}
