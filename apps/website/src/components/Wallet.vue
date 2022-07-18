<template>
  <div>
    <div class="connect-wallet-container">
      <div class="metamask-div">
        <button ref="connectMetamaskButton" @click="connectWallet('metamask')">
          connect-metamask
        </button>
        <p>
          Connected Metamsk Account:
          <span ref="metamaskAccountsResult">Address Not Active</span>
        </p>
      </div>
      <div class="coinbase-div">
        <button
          ref="connectCoinbaseButton"
          class="coinbase-btn"
          @click="connectWallet('coinbase')"
        >
          Connect Coinbase
        </button>
        <p>
          Connected Coinbase Account:
          <span ref="coinbaseAccountsResult">Address Not Active</span>
        </p>
      </div>
    </div>
    <div class="form-container">
      <form @submit.prevent="sendTransaction">
        <label for="address">Address</label>
        <input v-model="toAddress" type="text" placeholder="To Address" />
        <br />
        <label for="amount">Amount</label>
        <input v-model="amount" type="text" placeholder="Amount Ether" />
        <button type="submit">Send Transaction</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue'
import { WalletProvider } from '@/interfaces/WalletProvider'
import { ethers } from 'ethers'

const connectMetamaskButton: Ref = ref<HTMLDivElement>()
const connectCoinbaseButton: Ref = ref<HTMLDivElement>()
const metamaskAccountsResult: Ref = ref<HTMLSpanElement>()
const coinbaseAccountsResult: Ref = ref<HTMLSpanElement>()
const toAddress = ref<string>('') // Test to address: 0xD4e5faa8aD7d499Aa03BDDE2a3116E66bc8F8203
const amount = ref<string>('')

const defaultProviders = {
  metamask: undefined,
  coinbase: undefined,
}

async function requestAccount(provider: WalletProvider) {
  if (provider.request) {
    return await provider.request({
      method: 'eth_requestAccounts',
    })
  }
}

function getAvailableProviders(ethereum: any) {
  if (!ethereum) return defaultProviders
  else if (!ethereum.providerMap) {
    return {
      metamask: ethereum.isMetaMask ? ethereum : undefined,
      coinbase: ethereum.isCoinbaseWallet ? ethereum : undefined,
    }
  } else {
    return {
      metamask: ethereum.providerMap.get('MetaMask'),
      coinbase: ethereum.providerMap.get('CoinbaseWallet'),
    }
  }
}

const selectedProvider = ref<WalletProvider>({})
const ethereum: any = window.ethereum
const availableProviders = ref<Record<string, WalletProvider>>(
  getAvailableProviders(ethereum)
)

async function connectWallet(provider: string) {
  try {
    selectedProvider.value = availableProviders.value[provider]
    if (!selectedProvider.value) {
      throw new Error('No provider selected')
    }
    const account = await requestAccount(selectedProvider.value)

    // TODO: Turn this into vue native
    if (provider === 'metamask') {
      metamaskAccountsResult.value.innerText = ''
      metamaskAccountsResult.value.innerText = account[0]
      coinbaseAccountsResult.value.innerText = 'Not Active'
      connectCoinbaseButton.value.innerHTML = 'Activate Coinbase'
      connectMetamaskButton.value.innerHTML = 'Metamask Connected'
    } else if (provider === 'coinbase') {
      coinbaseAccountsResult.value.innerText = ''
      coinbaseAccountsResult.value.innerText = account[0]
      connectCoinbaseButton.value.innerHTML = 'Coinbase Connected'
      connectMetamaskButton.value.innerHTML = 'Activate Metamask'
      metamaskAccountsResult.value.innerText = 'Not Active'
    }
  } catch (error) {
    console.error(error)
  }
}

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
  width: 750px;
}

.coinbase-btn {
  background-color: blue;
}

.connect-wallet-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 5rem;
  border: 1px solid lightblue;
  padding: 2rem;
  width: 50%;
  /* center in middle of screen */
  margin-left: auto;
  margin-right: auto;
}

.form-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 5rem;
  border: 1px solid lightblue;
  padding: 2rem;
  width: 50%;
  /* center in middle of screen */
  margin-left: auto;
  margin-right: auto;
}

form {
  display: flex;
  flex-direction: column;
}

input {
  width: 500px;
  padding: 1rem;
}
</style>
