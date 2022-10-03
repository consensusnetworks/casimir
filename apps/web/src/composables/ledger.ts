import SpeculosHttpTransport from '@casimir/hw-transport-speculos'
import TransportWebUSB from '@ledgerhq/hw-transport-webusb'
import Eth from '@ledgerhq/hw-app-eth'
import { ethers } from 'ethers'

export default function useLedger() {
  const bip32Path = "44'/60'/0'/0/0"

  async function getLedgerEthSigner() {
    const transport = await _getLedgerTransport()
    return new Eth(transport)
  }

  async function _getLedgerTransport() {
    if (import.meta.env.PUBLIC_SPECULOS_PORT) {
      return await SpeculosHttpTransport.open(
        `http://127.0.0.1:${import.meta.env.PUBLIC_SPECULOS_PORT}`
      )
    } else {
      return await TransportWebUSB.create()
    }
  }

  async function sendLedgerTransaction(transaction: any) {
    // TODO: Replace according to selected testnet
    const infuraProvider = new ethers.providers.JsonRpcProvider(
      'https://goerli.infura.io/v3/4e8acb4e58bb4cb9978ac4a22f3326a7'
    )
    const _eth = await getLedgerEthSigner()
    const unsignedTransaction = ethers.utils
      .serializeTransaction(transaction)
      .substring(2)

    // TODO: Add resolution as third argument in signature
    // import ledgerService from '@ledgerhq/hw-app-eth/lib/services/ledger'
    // const resolution = await ledgerService.resolveTransaction(transaction)
    // console.log('resolution :>> ', resolution)
    const signature = await _eth.signTransaction(
      bip32Path,
      unsignedTransaction
      // resolution
    )
    signature.r = '0x' + signature.r
    signature.s = '0x' + signature.s
    signature.v = parseInt(signature.v)
    signature.from = transaction.value
    const signedTransaction = ethers.utils.serializeTransaction(
      transaction,
      signature
    )
    const txHash = await infuraProvider.sendTransaction(signedTransaction)
    console.log('txHash :>> ', txHash)
  }

  return {
    bip32Path,
    getLedgerEthSigner,
    sendLedgerTransaction,
  }
}
