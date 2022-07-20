<template>
  <div>
    <div class="connect-wallet-container">
      <div class="metamask-div">
        <button @click="connectWallet('metamask')">
          {{ metamaskButtonText }}
        </button>
        <p>
          Connected Metamask Account:
          <span> {{ metamaskAccountsResult }} </span>
        </p>
      </div>
      <div class="coinbase-div">
        <button class="coinbase-btn" @click="connectWallet('coinbase')">
          {{ coinbaseButtonText }}
        </button>
        <p>
          Connected Coinbase Account:
          <span> {{ coinbaseAccountsResult }} </span>
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
import { watchEffect } from 'vue'
import useWallet from '@/composables/wallet'

const {
  selectedProvider,
  selectedAccount,
  toAddress,
  amount,
  connectWallet,
  sendTransaction,
  metamaskButtonText,
  metamaskAccountsResult,
  coinbaseButtonText,
  coinbaseAccountsResult,
} = useWallet()

watchEffect(() => {
  if (selectedProvider.value.isMetaMask) {
    metamaskButtonText.value = 'Metamask Connected'
    metamaskAccountsResult.value = selectedAccount.value[0]
    coinbaseAccountsResult.value = 'Not Active'
    coinbaseButtonText.value = 'Connect Coinbase'
    metamaskButtonText.value = 'Metamask Connected'
  } else if (selectedProvider.value.isCoinbaseWallet) {
    coinbaseAccountsResult.value = ''
    coinbaseAccountsResult.value = selectedAccount.value[0]
    metamaskAccountsResult.value = 'Not Active'
    coinbaseButtonText.value = 'Coinbase Connected'
    metamaskButtonText.value = 'Connect Metamask'
  }
})
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
