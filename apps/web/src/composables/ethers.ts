import { EthersProvider } from '@/interfaces/EthersProvider'

export default function useEthers() {
  async function requestEthersAccount(provider: EthersProvider) {
    if (provider.request) {
      return await provider.request({
        method: 'eth_requestAccounts',
      })
    }
  }

  return { requestEthersAccount }
}
