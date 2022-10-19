import { ref, Ref } from 'vue'
import { ethers } from 'ethers'
import EthersWalletConnectSigner from '@casimir/ethers-wallet-connect-signer'
import WalletConnect from '@walletconnect/client'
import QRCodeModal from '@walletconnect/qrcode-modal'
import { TransactionInit } from '@/interfaces/TransactionInit'
import useEnvironment from '@/composables/environment'
import { MessageInit } from '@/interfaces/MessageInit'

export default function useWalletConnect() {
  const { walletConnectURL } = useEnvironment()
  let connector: WalletConnect | undefined
  const walletConnectAddress: Ref<string> = ref('')
  function enableWalletConnect() {
    connector = new WalletConnect({
      bridge: walletConnectURL, // Required
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

  function getEthersWalletConnectSigner() {
    const options = {
      baseURL: walletConnectURL
    }
    return new EthersWalletConnectSigner(options)
  }

  async function signWalletConnectMessage(messageInit: MessageInit) {
    const signer = getEthersWalletConnectSigner()
    return await signer.signMessage(messageInit.message)
  }

  async function sendWalletConnectTransaction(
    { to, value }: TransactionInit
  ): Promise<string> {
    // TODO: Better understand and handle gasPrice and gasLimit
    const gasLimit = ethers.utils.hexlify(21000).toString()
    const gasPrice = ethers.utils.hexlify(1000000000).toString()
    const tx = {
      from: walletConnectAddress.value,
      to,
      gas: gasLimit,
      gasPrice: gasPrice,
      value: ethers.utils.parseEther(value).toString(),
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
    getEthersWalletConnectSigner,
    signWalletConnectMessage,
    enableWalletConnect,
    sendWalletConnectTransaction,
    disableWalletConnect,
    walletConnectAddress,
  }
}
