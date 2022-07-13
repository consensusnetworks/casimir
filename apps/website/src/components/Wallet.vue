<template>
  <div>
    <div class="metamask-div">
      <button ref="connectMetamaskButton" @click="connectWallet('metamask')">
        connect-metamask
      </button>
      <p>
        Connected Metamsk Account:
        <span ref="metamaskAccountsResult" />
      </p>
    </div>
    <div class="coinbase-div">
      <button
        ref="connectCoinbaseButton"
        class="coinbase-btn"
        @click="connectWallet('coinbase')"
      >
        connect-coinbase
      </button>
      <p>
        Connected Coinbase Account:
        <span ref="coinbaseAccountsResult" />
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue'
import { WalletProvider } from '@/interfaces/WalletProvider'
import { Web3Provider } from '@/interfaces/Web3Provider'
import { ethers } from 'ethers'

const connectMetamaskButton: Ref = ref<HTMLDivElement>()
const connectCoinbaseButton: Ref = ref<HTMLDivElement>()
const metamaskAccountsResult: Ref = ref<HTMLSpanElement>()
const coinbaseAccountsResult: Ref = ref<HTMLSpanElement>()

const selectedProvider: any = ref({})
const ethereum: any = window.ethereum
const availableProviders: { [key: string]: WalletProvider } = {
  metamask: ethereum.providers.find(
    (provider: WalletProvider) => provider.isMetaMask
  ),
  coinbase: ethereum.providers.find(
    (provider: WalletProvider) => provider.isCoinbaseWallet
  ),
}

const connectWallet = async (provider: string) => {
  try {
    selectedProvider.value = availableProviders[provider]
    const account = await selectedProvider.value.request({
      method: 'eth_requestAccounts',
    })

    if (provider === 'metamask') {
      let p = document.createElement('p')
      p.innerText = account[0]
      metamaskAccountsResult.value.innerText = ''
      metamaskAccountsResult.value.appendChild(p)
    } else if (provider === 'coinbase') {
      let p = document.createElement('p')
      p.innerText = account[0]
      coinbaseAccountsResult.value.innerText = ''
      coinbaseAccountsResult.value.appendChild(p)
    }

    const web3Provider: ethers.providers.Web3Provider = new ethers.providers.Web3Provider(
      selectedProvider.value
    )

    connectMetamaskButton.value.innerHTML = 'Metamask connected'
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  console.log('availableProviders :>> ', availableProviders)

  // Optional TODO: Set a method that installs metamask for user (if not already installed).
  if (!isMetaMaskInstalled()) {
    console.log('MetaMask not installed')
  } else {
    console.log('MetaMask is installed')
  }
})

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
