<template>
  <div>
    <div class="metamask-div">
      <button ref="connectMetamaskButton" @click="onClickConnect('metamask')">
        connect-metamask
      </button>
      <button ref="getAccountsButton" @click="showAccounts">
        eth_accounts
      </button>
      <p>
        connected eth_accounts: <span ref="getAccountsResult">None yet</span>
      </p>
      <button ref="disconnectMetamaskButton" @click="disconnectMetamask">
        disconnect-metamask
      </button>
    </div>
    <!-- Coinbase wallet -->
    <div class="coinbase-div">
      <button
        ref="connectCoinbaseButton"
        class="coinbase-btn"
        @click="onClickConnect('coinbase')"
      >
        connect-coinbase
      </button>
      <button ref="getCoinbaseButton" class="coinbase-btn">
        coinbase_accounts
      </button>
      <p>
        connected coinbase_accounts:
        <span ref="getCoinbaseResult">None yet</span>
      </p>
    </div>
    <button
      ref="disconnectCoinbaseButton"
      class="coinbase-btn"
      @click="disconnectCoinbase"
    >
      disconnect-coinbase
    </button>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue'
import { WalletProvider } from '@/interfaces/WalletProvider'
import { Web3Provider } from '@/interfaces/Web3Provider'
/** Start Multiple Provider Configuration **/
import { ethers } from 'ethers'

const selectedProvider: any = ref({})

const ethereum: any = window.ethereum
// 'metamask', coinbase
const availableProviders: { [key: string]: WalletProvider } = {
  metamask: ethereum.providers.find(
    (provider: WalletProvider) => provider.isMetaMask
  ),
  coinbase: ethereum.providers.find(
    (provider: WalletProvider) => provider.isCoinbaseWallet
  ),
}
/** End Multiple Provider Configuration **/

const forwarderOrigin = 'http://localhost:9010'
const connectMetamaskButton: Ref = ref<HTMLDivElement>()
const getAccountsButton: Ref = ref<HTMLButtonElement>()
const getAccountsResult: Ref = ref<HTMLSpanElement>()
const disconnectMetamaskButton: Ref = ref<HTMLButtonElement>()

const disconnectMetamask = async () => {
  // Disconnect metamask
}

const disconnectCoinbase = async () => {
  // Disconnect coinbase wallet
  console.log('clicked!')
  // coinbaseWallet.disconnect()
}

const onClickConnect = async (provider: string) => {
  try {
    selectedProvider.value = availableProviders[provider]
    const account = await selectedProvider.value.request({
      method: 'eth_requestAccounts',
    })
    console.log('account in onClickConnect :>> ', account)

    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(
      selectedProvider.value
    )

    console.log(web3Provider)
    // const accounts = await ethereum.request({ method: 'eth_accounts' })
    // console.log('accounts in onClickConnect :>> ', accounts)
    // TODO: Disable this button while the request is pending!
    // eslint-disable-next-line no-undef
    connectMetamaskButton.value.innerHTML = 'Metamask connected'
    // console.log('ethereum.networkVersion :>> ', ethereum.networkVersion)
    // console.log('ethereum.selectedAddress :>> ', ethereum.selectedAddress)
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  console.log('availableProviders :>> ', availableProviders)
  // const onboarding = new MetaMaskOnboarding({ forwarderOrigin })

  // const onClickConnect = async (provider) => {
  //   try {
  //     selectedProvider.value = availableProviders[provider]
  //     const account = await selectedProvider.value.request({
  //       method: 'eth_requestAccounts',
  //     })
  //     console.log('account in onClickConnect :>> ', account)
  //     const web3Provider = new ethers.providers.Web3Provider(provider)
  //     // const accounts = await ethereum.request({ method: 'eth_accounts' })
  //     // console.log('accounts in onClickConnect :>> ', accounts)
  //     // TODO: Disable this button while the request is pending!
  //     // eslint-disable-next-line no-undef
  //     const isMetaMask = await detectEthereumProvider({ mustBeMetaMask: true })
  //     if (!isMetaMask) {
  //       console.log('MetaMask not detected')
  //       throw new Error('Metamask not detected')
  //     }
  //     connectMetamaskButton.value.innerHTML = 'Metamask connected'
  //     // console.log('ethereum.networkVersion :>> ', ethereum.networkVersion)
  //     // console.log('ethereum.selectedAddress :>> ', ethereum.selectedAddress)
  //   } catch (error) {
  //     console.error(error)
  //   }
  // }

  const onClickInstall = () => {
    console.log('onClickInstall')
    connectMetamaskButton.value.innerText =
      'Refresh page after installing Metamask'
    connectMetamaskButton.value.disabled = true
    // Starts the onboarding process for our end user
    onboarding.startOnboarding()
  }

  if (!isMetaMaskInstalled()) {
    console.log('MetaMask not installed')
    connectMetamaskButton.value.innerText = 'Click here to install MetaMask!'
    connectMetamaskButton.value.onclick = onClickInstall
    connectMetamaskButton.value.disabled = false
  } else {
    console.log('MetaMask is installed')
    connectMetamaskButton.value.innerText = 'Connect Metamask'
    // connectMetamaskButton.value.onclick = onClickConnect
    connectMetamaskButton.value.disabled = false
  }

  disconnectMetamaskButton.value.addEventListener('click', async () => {
    const result = await disconnectMetamask()
    console.log('result :>> ', result)
  })
})

const showAccounts = async () => {
  // eslint-disable-next-line no-undef
  const accounts = await ethereum.request({ method: 'eth_accounts' })
  // TODO: Determine how to get other accounts not currently selected in metamask UI
  if (accounts.length > 0) {
    accounts.forEach((account: string) => {
      getAccountsResult.value.innerText = ''
      let p = document.createElement('p')
      p.innerText = account
      getAccountsResult.value.appendChild(p)

      // getCoinbaseResult.value.innerText = ''
      // p = document.createElement('p')
      // p.innerText = account
      // getCoinbaseResult.value.appendChild(p)
    })
  } else {
    getAccountsResult.value.innerText = 'No accounts found'
  }
}

const isMetaMaskInstalled = () => {
  return Boolean(ethereum && ethereum.isMetaMask)
}
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  border: 1px solid lightblue;
}

input {
  border: 1px solid lightblue;
  border-radius: 4px;
}

button {
  background: #f36f38;
  border: none;
  border-radius: 3px;
  color: #fff;
  cursor: pointer;
  font-family: 'Open Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 15px;
  text-transform: uppercase;
  transition: all 0.3s ease-in-out;
  width: 100%;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.coinbase-btn {
  background-color: blue;
}
</style>
