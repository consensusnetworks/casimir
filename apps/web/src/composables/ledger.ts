import { BitcoinLedgerSigner, EthersLedgerSigner } from '@casimir/wallets'
import { ethers } from 'ethers'
import { Currency, MessageInit, ProviderString, TransactionInit } from '@casimir/types'
import useEnvironment from '@/composables/environment'
import useEthers from '@/composables/ethers'
import useAuth from '@/composables/auth'

const { getMessage, login } = useAuth()

export default function useLedger() {
  const { ethereumURL, ledgerType, speculosURL } = useEnvironment()
  const { getGasPriceAndLimit } = useEthers()

  function getBitcoinLedgerSigner() {
    const options = {
      type: ledgerType,
      baseURL: speculosURL
    }
    return new BitcoinLedgerSigner(options)
  }

  function getEthersLedgerSigner() {
    const options = {
      provider: new ethers.providers.JsonRpcProvider(ethereumURL),
      type: ledgerType,
      baseURL: speculosURL
    }
    return new EthersLedgerSigner(options)
  }

  async function getBitcoinLedgerAddress() {
    const signer = getBitcoinLedgerSigner()
    return await signer.getAddress()
  }

  async function getEthersLedgerAddress() {
    const signer = getEthersLedgerSigner()
    return await signer.getAddress()
  }

  async function loginWithLedger(provider: ProviderString, address: string, currency: Currency) {
    try {
      const { message } = await (await getMessage(provider, address)).json()
      const signer = getEthersLedgerSigner()
      const signature = await signer.signMessage(message)
      const loginResponse = await login({ 
        provider, 
        address, 
        message: message.toString(), 
        signedMessage: signature,
        currency
      })
      return await loginResponse.json()
    } catch (err) {
      console.log('Error logging in: ', err)
      return err
    }
  }

  async function sendLedgerTransaction({ from, to, value, currency }: TransactionInit) {
    if (currency === 'ETH') {
      const signer = getEthersLedgerSigner()
      const provider = signer.provider as ethers.providers.Provider
      const unsignedTransaction = {
        to,
        value: ethers.utils.parseUnits(value),
        type: 0
      } as ethers.UnsignedTransaction
      
      // Todo check before click (user can +/- gas limit accordingly)
      const { gasPrice, gasLimit } = await getGasPriceAndLimit(ethereumURL, unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
      const balance = await provider.getBalance(from)
      const required = gasPrice.mul(gasLimit).add(ethers.utils.parseEther(value))
      console.log('Balance', ethers.utils.formatEther(balance))
      console.log('Required', ethers.utils.formatEther(required))
  
      return await signer.sendTransaction(unsignedTransaction as ethers.utils.Deferrable<ethers.providers.TransactionRequest>)
    } else if (currency === 'BTC') {
      alert('Send transaction not yet implemented for BTC')
    }
  }

  async function signLedgerMessage(messageInit: MessageInit): Promise<string> {
    if (messageInit.currency === 'ETH') {
      const { message } = messageInit
      const signer = getEthersLedgerSigner()
      return await signer.signMessage(message)
    } else if ( messageInit.currency === 'BTC') {
      const { message } = messageInit
      const signer = getBitcoinLedgerSigner()
      return await signer.signMessage(message)
    } else {
      return ''
    }
  }

  return {
    getBitcoinLedgerAddress,
    getBitcoinLedgerSigner,
    getEthersLedgerAddress,
    getEthersLedgerSigner,
    loginWithLedger,
    signLedgerMessage,
    sendLedgerTransaction,
  }
}
