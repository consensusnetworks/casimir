import EthersLedgerSigner from '@casimir/ethers-ledger-signer'
import { ethers } from 'ethers'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { TransactionRequest } from '@ethersproject/abstract-provider'
import { MessageInit } from '@/interfaces/MessageInit'
import useEnvironment from '@/composables/environment'

const ledgerPath = '44\'/60\'/0\'/0/0'

export default function useLedger() {
  const { ethereumURL, ledgerType, speculosURL } = useEnvironment()

  function getEthersLedgerSigner() {
    const options = {
      provider: new ethers.providers.JsonRpcProvider(ethereumURL),
      type: ledgerType,
      path: ledgerPath,
      baseURL: speculosURL
    }
    return new EthersLedgerSigner(options)
  }

  async function getLedgerAddress() {
    const signer = getEthersLedgerSigner()
    return await signer.getAddress()
  }

  async function sendLedgerTransaction({ from, to, value }: TransactionInit) {
    const signer = getEthersLedgerSigner()
    const provider = signer.provider as ethers.providers.Provider
    const { chainId } = await provider.getNetwork()
    const gasPrice = await provider.getGasPrice()
    const nonce = await provider.getTransactionCount(from)
    const unsignedTransaction = {
      to,
      gasPrice,
      nonce,
      chainId,
      value: ethers.utils.parseUnits(value)
    } as ethers.utils.UnsignedTransaction
    const gasLimit = await provider.estimateGas(
      unsignedTransaction as ethers.utils.Deferrable<TransactionRequest>
    )
    unsignedTransaction.gasLimit = gasLimit

    // Todo check before click (user can +/- gas limit accordingly)
    const balance = await provider.getBalance(from)
    const required = gasPrice.mul(gasLimit).add(ethers.utils.parseEther(value))
    console.log('Balance', ethers.utils.formatEther(balance))
    console.log('Required', ethers.utils.formatEther(required))

    return await signer.sendTransaction(unsignedTransaction as ethers.utils.Deferrable<TransactionRequest>)
  }

  async function signLedgerMessage(messageInit: MessageInit): Promise<string> {
    const { hashedMessage } = messageInit
    const signer = getEthersLedgerSigner()
    return await signer.signMessage(hashedMessage)
  }

  return {
    ledgerPath,
    getLedgerAddress,
    getEthersLedgerSigner,
    signLedgerMessage,
    sendLedgerTransaction,
  }
}
