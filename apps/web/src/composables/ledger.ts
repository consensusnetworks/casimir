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

  // look at ethers.utils.UnsignedTransaction to make sure that doesn't suffice for you
  // @shanejonas - Is there a ethers.utils.UnsignedTransaction method? https://docs.ethers.io/v5/api/utils/transactions/#transactions--functions
  // a type, see line below
  // @cccccali can I get term access. stepping away for aminute but can go audio in a bit
  async function sendLedgerTransaction(
    transaction: ethers.utils.UnsignedTransaction
  ) {
    const provider = new ethers.providers.JsonRpcProvider(
      import.meta.env.ETHEREUM_RPC || 'http://127.0.0.1:8545'
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

    // TODO: Fix types here
    signature.v = parseInt(signature.v)
    signature.from = transaction.value // @chris there's just no way
    const signedTransaction = ethers.utils.serializeTransaction(
      transaction,
      signature
    )
    const txHash = await provider.sendTransaction(signedTransaction)
    console.log('txHash :>> ', txHash)
  }

  async function signMessageWithLedger(message: string) {
    const _eth = await getLedgerEthSigner()
    const signature = await _eth.signPersonalMessage(
      bip32Path,
      Buffer.from(message).toString('hex')
    )
    const signedHash =
      '0x' + signature.r + signature.s + signature.v.toString(16)
    return signedHash
  }

  return {
    bip32Path,
    getLedgerEthSigner,
    signMessageWithLedger,
    sendLedgerTransaction,
  }
}
