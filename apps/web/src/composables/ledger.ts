import SpeculosHttpTransport from '@casimir/hw-transport-speculos'
import TransportWebUSB from '@ledgerhq/hw-transport-webusb'
import Eth, { ledgerService } from '@ledgerhq/hw-app-eth'
import { ethers } from 'ethers'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { Deferrable } from '@ethersproject/properties'
import { TransactionRequest } from '@ethersproject/abstract-provider'

export default function useLedger() {
  const bip32Path = '44\'/60\'/0\'/0/0'

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

  async function sendLedgerTransaction({ from, to, value }: TransactionInit) {
    const rpcUrl = import.meta.env.PUBLIC_ETHEREUM_RPC || 'http://localhost:8545/'
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    const { chainId } = await provider.getNetwork() // Why this?
    const gasPriceHex = (await provider.getGasPrice())._hex // What is offering us this?
    const gasPrice = '0x' + (parseInt(gasPriceHex, 16) * 1.15).toString(16) // Why this?
    const nonce = await provider.getTransactionCount(from, 'latest') // Why do we have the option not to provide this?
    const unsignedTransaction: ethers.utils.UnsignedTransaction = {
      to,
      gasPrice,
      nonce,
      chainId,
      data: '0x00',
      value: ethers.utils.parseUnits(value)
    } // What did I have before??

    // Todo check before click (user can +/- gas limit accordingly) // Are you saying to provide another front-end input field for gas limit?
    const gasEstimate = await provider.estimateGas(
      unsignedTransaction as Deferrable<TransactionRequest>
    ) // Why is this a thing (having a gasEstimate and gasLimit)?
    const gasLimit = Math.ceil(parseInt(gasEstimate.toString()) * 1.3)
    unsignedTransaction.gasLimit = ethers.utils.hexlify(gasLimit)
    const balance = await provider.getBalance(from)
    const required = ethers.BigNumber.from(gasPrice)
      .mul(gasLimit)
      .add(ethers.utils.parseEther(value))
    console.log('Balance', ethers.utils.formatEther(balance))
    console.log('Required', ethers.utils.formatEther(required))

    const ledger = await getLedgerEthSigner()
    const rawUnsignedTransaction = ethers.utils
      .serializeTransaction(unsignedTransaction)
      .substring(2)
    const resolution = await ledgerService.resolveTransaction(
      rawUnsignedTransaction,
      {},
      {}
    )
    const { v, r, s } = await ledger.signTransaction(
      bip32Path,
      rawUnsignedTransaction,
      resolution
    )
    const signature = {
      v: parseInt(v),
      r: '0x' + r,
      s: '0x' + s,
      from,
    }
    const signedTransaction = ethers.utils.serializeTransaction(
      unsignedTransaction,
      signature
    )
    return await provider.sendTransaction(signedTransaction)
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
