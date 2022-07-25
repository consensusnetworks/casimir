import { ref } from 'vue'
import Antenna from 'iotex-antenna'

import { WsSignerPlugin } from 'iotex-antenna/lib/plugin/ws'
import { toRau } from 'iotex-antenna/lib/account/utils'
import sleepPromise from 'sleep-promise'

export default function useIopay() {
  const toIoPayAddress = ref<string>('') // Test to address: 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
  const ioPayAmount = ref<string>('')

  const sendIoPayTransaction = async () => {
    try {
      const antenna = new Antenna('http://api.testnet.iotex.one:80', {
        signer: new WsSignerPlugin(),
      })
      await sleepPromise(3000)
      const transResp = await antenna?.iotx.sendTransfer({
        to: `${toIoPayAddress}`,
        from: antenna.iotx.accounts[0].address,
        value: toRau('1', 'Iotx'),
        gasLimit: '100000',
        gasPrice: toRau('1', 'Qev'),
        // chainId: 'IoTeXChain',
      })

      console.log('transResp :>> ', transResp)
    } catch (err) {
      // TODO: handle submit error and guide user
      console.log(err)
    }
  }

  const stakeIoPay = async () => {
    const antenna = new Antenna('http://api.testnet.iotex.one:80', {
      signer: new WsSignerPlugin(),
    })

    // TODO: Replace with appropriate abi, etc.
    const transResp = await antenna?.iotx.executeContract(
      {
        contractAddress: 'io1jmq0epcswzu7vyquxlr9j9jvplwpvtc4d50ze9',
        amount: '0',
        abi: '[{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]',
        method: 'set',
        gasLimit: '100000',
        gasPrice: toRau('1', 'Qev'),
        from: antenna.iotx.accounts[0].address,
      },
      666
    )
    await sleepPromise(20000)
    console.log(`transResp => ${transResp}`)
  }

  return { toIoPayAddress, ioPayAmount, sendIoPayTransaction, stakeIoPay }
}
