import Antenna from 'iotex-antenna'
import { WsSignerPlugin } from 'iotex-antenna/lib/plugin/ws'
import { toRau } from 'iotex-antenna/lib/account/utils'
import useWallet from '@/composables/wallet'

// TODO: Figure out why these refe aren't updating
// const { toAddress, amount } = useWallet()

export default function useIopay() {
  const signer = new WsSignerPlugin()
  const antenna = new Antenna('http://api.testnet.iotex.one:80', {
    signer,
  })

  const getIoPayAccounts = async () => {
    return await signer.getAccounts()
  }

  const sendIoPayTransaction = async (toAddress: string, amount: string) => {
    try {
      const transResp = await antenna?.iotx.sendTransfer({
        to: `${toAddress}`,
        from: antenna.iotx.accounts[0].address,
        value: toRau(amount, 'Iotx'),
        gasLimit: '100000',
        gasPrice: toRau('1', 'Qev'),
        chainID: 2,
      })
    } catch (err) {
      // TODO: handle submit error and guide user
      console.log(err)
    }
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
    // stakeIoPay,
  }
}
