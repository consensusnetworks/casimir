<template>
  <div>
    <div class="connect-wallet-container">
      <div class="metamask-div">
        <button @click="connectWallet('MetaMask')">
          {{ metamaskButtonText }}
        </button>
        <p>
          Connected Metamask Account:
          <span> {{ metamaskAccountsResult }} </span>
        </p>
      </div>
      <div class="coinbase-div">
        <button class="coinbase-btn" @click="connectWallet('CoinbaseWallet')">
          {{ coinbaseButtonText }}
        </button>
        <p>
          Connected Coinbase Account:
          <span> {{ coinbaseAccountsResult }} </span>
        </p>
      </div>
      <div class="ioPay-div">
        <button class="iopay-btn" @click="connectWallet('IoPay')">
          {{ ioPayButtonText }}
        </button>
        <p>
          Connected ioPay Account:
          <span> {{ ioPayAccountsResult }} </span>
        </p>
      </div>
      <div class="phantom-div">
        <button class="phantom-btn" @click="connectWallet('Phantom')">
          {{ phantomButtonText }}
        </button>
        <p>
          Connected phantom Account:
          <span> {{ phantomAccountsResult }} </span>
        </p>
      </div>
    </div>
    <div class="form-container">
      <form @submit.prevent="sendTransaction(selectedProvider)">
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
import { ref, watchEffect } from 'vue'
import useWallet from '@/composables/wallet'

const metamaskButtonText = ref<string>('Connect Metamask')
const metamaskAccountsResult = ref<string>('Address Not Active')
const coinbaseButtonText = ref<string>('Connect CoinbaseWallet')
const coinbaseAccountsResult = ref<string>('Address Not Active')
const ioPayButtonText = ref<string>('Connect ioPay')
const ioPayAccountsResult = ref<string>('Address Not Active')
const phantomButtonText = ref<string>('Connect Phantom')
const phantomAccountsResult = ref<string>('Address Not Active')

const providerButtonTexts = [
  { provider: 'MetaMask', value: metamaskButtonText },
  { provider: 'CoinbaseWallet', value: coinbaseButtonText },
  { provider: 'IoPay', value: ioPayButtonText },
  { provider: 'Phantom', value: phantomButtonText },
]

const providerAccountsResults = [
  metamaskAccountsResult,
  coinbaseAccountsResult,
  ioPayAccountsResult,
  phantomAccountsResult,
]

const {
  selectedProvider,
  selectedAccount,
  toAddress,
  amount,
  connectWallet,
  sendTransaction,
} = useWallet()

watchEffect(() => {
  if (selectedProvider.value === 'MetaMask') {
    resetProviderButtonTexts()
    metamaskButtonText.value = 'MetaMask Connected'
    resetProviderAccountResults()
    metamaskAccountsResult.value = selectedAccount.value
  } else if (selectedProvider.value === 'CoinbaseWallet') {
    resetProviderButtonTexts()
    coinbaseButtonText.value = 'Coinbase Connected'
    resetProviderAccountResults()
    coinbaseAccountsResult.value = selectedAccount.value
  } else if (selectedProvider.value === 'IoPay') {
    resetProviderButtonTexts()
    ioPayButtonText.value = 'IoPay Connected'
    resetProviderAccountResults()
    ioPayAccountsResult.value = selectedAccount.value || 'Not Active'
  } else if (selectedProvider.value === 'Phantom') {
    resetProviderButtonTexts()
    phantomButtonText.value = 'Phantom Connected'
    resetProviderAccountResults()
    phantomAccountsResult.value = selectedAccount.value
  }
})

const resetProviderButtonTexts = () => {
  providerButtonTexts.forEach((item) => {
    item.value.value = `Connect ${item.provider}`
  })
}

const resetProviderAccountResults = () => {
  providerAccountsResults.forEach((providerAccountsResult) => {
    providerAccountsResult.value = 'Address Not Active'
  })
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

.iopay-btn {
  background-color: rgb(0, 218, 180);
}

.phantom-btn {
  background-color: purple;
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
