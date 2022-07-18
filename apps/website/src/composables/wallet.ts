import { ref } from 'vue'
import { ethers } from 'ethers'
import { WalletProvider } from '@/interfaces/WalletProvider'

export default function useWallet() {
  const selectedProvider = ref<WalletProvider>({})
  const toAddress = ref<string>('') // Test to address: 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
  const amount = ref<string>('')

  async function sendTransaction() {
    try {
      const web3Provider: ethers.providers.Web3Provider =
        new ethers.providers.Web3Provider(selectedProvider.value)
      const signer = web3Provider.getSigner()
      const etherAmount = ethers.utils.parseEther(amount.value)
      const tx = {
        to: toAddress.value,
        value: etherAmount,
      }
      signer.sendTransaction(tx).then((txObj) => {
        console.log('successful txHash: ', txObj.hash)
      })
    } catch (error) {
      console.error(error)
    }
  }

  return { selectedProvider, toAddress, amount, sendTransaction }
}
