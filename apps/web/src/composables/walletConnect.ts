import WalletConnect from '@walletconnect/client'
import QRCodeModal from '@walletconnect/qrcode-modal'
import { ref, Ref } from 'vue'

export default function useWalletConnect() {
  const connector: Ref<WalletConnect | undefined> = ref()
  const walletConnectAddress: Ref<string> = ref('')
  function enableWalletConnect() {
    connector.value = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org', // Required
      qrcodeModal: QRCodeModal,
    })
    if (!connector.value.connected) {
      connector.value.createSession()
    }
    connector.value.on('connect', (error: any, payload: any) => {
      if (error) {
        throw error
      }
      // Get provided accounts and chainId
      const { accounts, chainId } = payload.params[0]
      walletConnectAddress.value = accounts[0]
    })
    connector.value.on('session_update', (error: any, payload: any) => {
      if (error) {
        throw error
      }
      // Get updated accounts and chainId
      const { accounts, chainId } = payload.params[0]
    })
    connector.value.on('disconnect', (error: any) => {
      if (error) {
        console.log(`disconnect error :>> ${error}`)
        // throw error
      }
      // Delete connector
      try {
        connector.value?.killSession()
      } catch (error) {
        console.log(`disconnect error in listener :>> ${error}`)
      }
    })
    return
  }

  async function sendWalletConnectTx(amount: string, toAddress: string) {
    const tx = {
      from: walletConnectAddress.value,
      to: toAddress,
      gas: '0.00001', // TODO: Make this dynamic
      gasPrice: '',
      value: amount,
      data: 'data',
      nonce: 'nonce',
    }
    try {
      await connector.value?.sendTransaction(tx)
    } catch (err) {
      console.log('error in sendWalletConnectTx :>> ', err)
    }
  }

  async function disableWalletConnect() {
    try {
      await connector.value?.killSession()
    } catch (err) {
      console.log('error in disableWalletConnect :>> ', err)
    }
  }

  return {
    enableWalletConnect,
    sendWalletConnectTx,
    disableWalletConnect,
    walletConnectAddress,
  }
}
