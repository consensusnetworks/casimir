import SpeculosHttpTransport from '@casimir/hw-transport-speculos'
import TransportWebUSB from '@ledgerhq/hw-transport-webusb'
import Eth, { ledgerService } from '@ledgerhq/hw-app-eth'
import { ethers } from 'ethers'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { Deferrable } from '@ethersproject/properties'
import { TransactionRequest } from '@ethersproject/abstract-provider'
import { MessageInit } from '@/interfaces/MessageInit'

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
    const { chainId } = await provider.getNetwork()
    const gasPrice = await provider.getGasPrice()
    const nonce = await provider.getTransactionCount(from)
    const unsignedTransaction: ethers.utils.UnsignedTransaction = {
      to,
      gasPrice,
      nonce,
      chainId,
      value: ethers.utils.parseUnits(value)
    }
    const gasLimit = await provider.estimateGas(
      unsignedTransaction as Deferrable<TransactionRequest>
    )
    unsignedTransaction.gasLimit = gasLimit
      
    // Todo check before click (user can +/- gas limit accordingly)
    const balance = await provider.getBalance(from)
    const required = gasPrice.mul(gasLimit).add(ethers.utils.parseEther(value))
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
      from
    }
    const signedTransaction = ethers.utils.serializeTransaction(
      unsignedTransaction,
      signature
    )
    await ledger.transport.close()
    return await provider.sendTransaction(signedTransaction)
  }

  async function signLedgerMessage(messageInit: MessageInit): Promise<string> {
    const { hashedMessage } = messageInit
    const _eth = await getLedgerEthSigner()
    const signature = await _eth.signPersonalMessage(
      bip32Path,
      Buffer.from(hashedMessage).toString('hex')
    )
    const signedHash =
      '0x' + signature.r + signature.s + signature.v.toString(16)
    return signedHash
  }

  return {
    bip32Path,
    getLedgerEthSigner,
    signLedgerMessage,
    sendLedgerTransaction,
  }
}
