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

  async function sendEthersLedgerTransaction({ from, to, value }: TransactionInit) {
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
  }

  async function signEthersLedgerMessage(messageInit: MessageInit): Promise<string> {
    const { message } = messageInit
    const signer = getEthersLedgerSigner()
    return await signer.signMessage(message)
  }

  return {
    signEthersLedgerMessage,
    sendEthersLedgerTransaction,
    getBitcoinLedgerAddress,
    getEthersLedgerAddress,
    getBitcoinLedgerSigner,
    getEthersLedgerSigner,
  }
}
