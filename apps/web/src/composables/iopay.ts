import Antenna from 'iotex-antenna'
import { WsSignerPlugin } from 'iotex-antenna/lib/plugin/ws'
import { toRau } from 'iotex-antenna/lib/account/utils'
import { TransactionInit } from '@/interfaces/TransactionInit'
import { MessageInit } from '@/interfaces/MessageInit'

export default function useIoPay() {
  const signer = new WsSignerPlugin()
  const antenna = new Antenna('http://api.testnet.iotex.one:80', 2, {
    signer,
  })

  const getIoPayAddress = async () => {
    const accounts = await signer.getAccounts()
    const { address } = accounts[0]
    return address
  }

  const sendIoPayTransaction = async ({ to, value }: TransactionInit) => {
    try {
      const transResp = await antenna?.iotx.sendTransfer({
        to: `${to}`,
        from: antenna.iotx.accounts[0].address,
        value: toRau(value, 'Iotx'),
        gasLimit: '100000',
        gasPrice: toRau('1', 'Qev'),
      })
      return transResp
    } catch (err) {
      // TODO: handle submit error and guide user
      console.log(err)
    }
  }

  const signIoPayMessage = async (messageInit: MessageInit): Promise<Buffer> => {
    const { message } = messageInit
    return await signer.signMessage(message)
  }

  return {
    getIoPayAddress,
    sendIoPayTransaction,
    signIoPayMessage,
    // stakeIoPay,
  }
}
