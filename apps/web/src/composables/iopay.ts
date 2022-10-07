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

  const getIoPayAccounts = async () => {
    return await signer.getAccounts()
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

  const signIoPayMessage = async (messageInit: MessageInit): Promise<string> => {
    const { hashedMessage } = messageInit
    return await signer.signMessage(hashedMessage)
  }

  //   const stakeIoPay = async () => {
  //     // TODO: Replace with appropriate abi, etc.
  //     const transResp = await antenna?.iotx.executeContract(
  //       {
  //         contractAddress: 'io1jmq0epcswzu7vyquxlr9j9jvplwpvtc4d50ze9',
  //         amount: '0',
  //         abi: '[{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]',
  //         method: 'set',
  //         gasLimit: '100000',
  //         gasPrice: toRau('1', 'Qev'),
  //         from: antenna.iotx.accounts[0].address,
  //       },
  //       666
  //     )
  //     // TODO: add setTimeout to simulate what sleep promise did for us?
  //     console.log(`transResp => ${transResp}`)
  //   }

  return {
    getIoPayAccounts,
    sendIoPayTransaction,
    signIoPayMessage,
    // stakeIoPay,
  }
}
