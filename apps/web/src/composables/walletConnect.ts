import WalletConnect from '@walletconnect/client'
import QRCodeModal from '@walletconnect/qrcode-modal'
import { ref, Ref } from 'vue'
import { ethers } from 'ethers'
import { TransactionInit } from '@/interfaces/TransactionInit'

export default function useWalletConnect() {
  let connector: WalletConnect | undefined
  const walletConnectAddress: Ref<string> = ref('')
  function enableWalletConnect() {
    connector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org', // Required
      qrcodeModal: QRCodeModal,
    })
    if (!connector.connected) {
      connector.createSession()
    }
    connector.on('connect', (error: any, payload: any) => {
      if (error) {
        throw error
      }
      // Get provided accounts and chainId
      const { accounts, chainId } = payload.params[0]
      walletConnectAddress.value = accounts[0]
    })
    connector.on('session_update', (error: any, payload: any) => {
      if (error) {
        throw error
      }
      // Get updated accounts and chainId
      const { accounts, chainId } = payload.params[0]
    })
    connector.on('disconnect', (error: any) => {
      if (error) {
        console.log(`disconnect error :>> ${error}`)
        // throw error
      }
      // Delete connector
      try {
        connector?.killSession()
      } catch (error) {
        console.log(`disconnect error in listener :>> ${error}`)
      }
    })
    return
  }

  async function sendWalletConnectTransaction(
    { to, value }: TransactionInit
  ): Promise<string> {
    const amountInWei = ethers.utils.parseEther(value).toString()
    // TODO: Better understand and handle gasPrice and gasLimit
    const gasLimit = ethers.utils.hexlify(21000).toString()
    const gasPrice = ethers.utils.hexlify(1000000000).toString()
    const tx = {
      from: walletConnectAddress.value,
      to,
      gas: gasLimit,
      gasPrice: gasPrice,
      value: amountInWei,
      // nonce: 'nonce', // TODO: Use ethers to get nonce for current address
    }
    return await connector?.sendTransaction(tx)
  }

  async function disableWalletConnect() {
    try {
      await connector?.killSession()
    } catch (err) {
      console.log('error in disableWalletConnect :>> ', err)
    }
  }

  return {
    enableWalletConnect,
    sendWalletConnectTransaction,
    disableWalletConnect,
    walletConnectAddress,
  }
}
