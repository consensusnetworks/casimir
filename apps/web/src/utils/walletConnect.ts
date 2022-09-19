import WalletConnect from '@walletconnect/client'
import QRCodeModal from '@walletconnect/qrcode-modal'

export function enableWalletConnect() {
  let walletConnectAddress = ''
  const connector = new WalletConnect({
    bridge: 'https://bridge.walletconnect.org', // Required
    qrcodeModal: QRCodeModal,
  })
  if (!connector.connected) {
    console.log('connecting via WalletConnect...')
    connector.createSession()
  }
  connector.on('connect', (error: any, payload: any) => {
    if (error) {
      throw error
    }
    // Get provided accounts and chainId
    const { accounts, chainId } = payload.params[0]
    walletConnectAddress = accounts[0]
    console.log('chainId :>> ', chainId)
  })
  connector.on('session_update', (error: any, payload: any) => {
    if (error) {
      throw error
    }
    // Get updated accounts and chainId
    const { accounts, chainId } = payload.params[0]
    console.log('accounts in session_update listener :>> ', accounts)
    console.log('chainId in session_update listener :>> ', chainId)
  })
  connector.on('disconnect', (error: any) => {
    if (error) {
      console.log(`disconnect error :>> ${error}`)
      // throw error
    }
    // Delete connector
    try {
      connector.killSession()
    } catch (error) {
      console.log(`disconnect error in listener :>> ${error}`)
    }
  })
  return {
    connector: connector,
    walletConnectAddress: walletConnectAddress,
  }
}

export async function sendWalletConnectTx(
  connector: WalletConnect,
  walletConnectAddress: string,
  amount: string,
  toAddress: string
) {
  const tx = {
    from: walletConnectAddress,
    to: toAddress,
    gas: '0.00001',
    gasPrice: '',
    value: amount,
    data: 'data',
    nonce: 'nonce',
  }
  try {
    console.log('tx :>> ', tx)
    await connector.sendTransaction(tx)
  } catch (err) {
    console.log('error in sendWalletConnectTx :>> ', err)
  }
}

export async function disableWalletConnect(currentConnector: WalletConnect) {
  try {
    await currentConnector.killSession()
    console.log('walletConnect disabled')
  } catch (err) {
    console.log('error in disableWalletConnect :>> ', err)
  }
}
