import EthersLedgerSigner from '@casimir/ethers-ledger-signer'
import BitcoinLedgerSigner from '@casimir/bitcoin-ledger-signer'
import { ethers } from 'ethers'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { MessageInit } from '@/interfaces/MessageInit'
import useEnvironment from '@/composables/environment'
import useEthers from '@/composables/ethers'

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

  async function sendLedgerTransaction({ from, to, value, token }: TransactionInit) {
    if (token === 'ETH') {
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
    } else if (token === 'BTC') {
      alert('Send transaction not yet implemented for BTC')
    }
  }

  async function signLedgerMessage(messageInit: MessageInit): Promise<string> {
    if (messageInit.token === 'ETH') {
      const { message } = messageInit
      const signer = getEthersLedgerSigner()
      return await signer.signMessage(message)
    } else if ( messageInit.token === 'BTC') {
      const { message } = messageInit
      const signer = getBitcoinLedgerSigner()
      return await signer.signMessage(message)
    } else {
      return ''
    }
  }

  return {
    signLedgerMessage,
    sendLedgerTransaction,
    getBitcoinLedgerAddress,
    getEthersLedgerAddress,
    getBitcoinLedgerSigner,
    getEthersLedgerSigner,
  }
}
