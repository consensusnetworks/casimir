import EthersLedgerSigner from '@casimir/ethers-ledger-signer'
import { ethers } from 'ethers'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { MessageInit } from '@/interfaces/MessageInit'
import useEnvironment from '@/composables/environment'
import useEthers from '@/composables/ethers'

import bitcoinLedgerSigner from '@casimir/bitcoin-ledger-signer'

const ledgerPath = 'm/44\'/60\'/0\'/0/0'

export default function useLedger() {
  const { ethereumURL, ledgerType, speculosURL } = useEnvironment()
  const { getGasPriceAndLimit } = useEthers()

  async function getBitcoinLedgerSigner() {
      const bitcoinSigner = await bitcoinLedgerSigner()
      console.log('bitcoinSigner in ledger.ts :>> ', bitcoinSigner)
      return bitcoinSigner
  }

  function getEthersLedgerSigner() {
    const options = {
      provider: new ethers.providers.JsonRpcProvider(ethereumURL),
      type: ledgerType,
      path: ledgerPath,
      baseURL: speculosURL
    }
    return new EthersLedgerSigner(options)
  }

  async function getLedgerAddress(blockchain: BlockchainString) {
    let signer
    if (blockchain === 'Bitcoin') {
      console.log('working on this')
    } else if (blockchain === 'Ethereum') {
      signer = getEthersLedgerSigner()
      return await signer.getAddress()
    }
  }

  async function sendLedgerTransaction({ from, to, value }: TransactionInit) {
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

  async function signLedgerMessage(messageInit: MessageInit): Promise<string> {
    const { message } = messageInit
    const signer = getEthersLedgerSigner()
    return await signer.signMessage(message)
  }

  return {
    ledgerPath,
    getLedgerAddress,
    getEthersLedgerSigner,
    getBitcoinLedgerSigner,
    signLedgerMessage,
    sendLedgerTransaction,
  }
}
