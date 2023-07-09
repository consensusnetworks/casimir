<template>
  <div>
    <h5>Connect Wallet to Log In or Add Account</h5>
    <div>
      <button @click="selectProvider('MetaMask')">
        Select MetaMask
      </button>
      <button
        class="brave-btn"
        @click="selectProvider('BraveWallet')"
      >
        Select Brave Wallet
      </button>
      <button
        class="coinbase-btn"
        @click="selectProvider('CoinbaseWallet')"
      >
        Select Coinbase Wallet
      </button>
      <button
        class="ledger-btn"
        @click="selectProvider('Ledger')"
      >
        Select Ledger
      </button>
      <button
        class="okx-btn"
        @click="selectProvider('OkxWallet')"
      >
        Select OKX Wallet
      </button>
      <button
        class="trezor-btn"
        @click="selectProvider('Trezor')"
      >
        Select Trezor
      </button>
      <button
        class="trust-btn"
        @click="selectProvider('TrustWallet')"
      >
        Select Trust Wallet
      </button>
      <button
        class="wallet-connect-btn"
        @click="selectProvider('WalletConnect')"
      >
        Select WalletConnect
      </button>
    </div>
    <button
      v-for="address in user?.accounts"
      :key="address.address"
      @click="selectAddress(address.address, address.pathIndex)"
    >
      Connect this address: {{ address.address }}
    </button>
    <div>
      <h5>Primary Account:</h5>
      <div>{{ primaryAddress ? primaryAddress : 'Please log in first.' }}</div>
      <button @click="setPrimaryWalletAccount()">
        Set Primary Account
      </button>
    </div>
    <div>
      <button
        class="btn-save-remove-account"
        @click="removeConnectedAccount()"
      >
        Remove Account
      </button>
    </div>
    <h5>Staking</h5>
    <div class="staking-container">
      <button @click="getPools(selectedAddress)">
        Get pending and staked user pools
      </button>
      <input
        v-model="amountToStake"
        placeholder="Amount to Stake"
      >
      <button @click="deposit({ amount: amountToStake, walletProvider: selectedProvider })">
        Steak
      </button>
      <button @click="withdraw({ amount: amountToStake, walletProvider: selectedProvider })">
        Withdraw
      </button>
    </div>
    <h5 class="my-4">
      Signing and Sending
    </h5>
    <div class="sign-and-stake">
      <div class="sign-message-container">
        <input
          v-model="message"
          type="text"
          placeholder="Write a message to sign"
        >
        <button @click="signMessage(message)">
          Sign Message
        </button>
        <p>{{ signedMessage }}</p>
      </div>
      <form @submit.prevent="sendTransaction()">
        <label for="address">Address</label>
        <input
          v-model="toAddress"
          type="text"
          placeholder="To Address"
        >
        <br>
        <label for="amount">Amount</label>
        <input
          v-model="amount"
          type="text"
          placeholder="Amount Ether"
        >
        <button type="submit">
          Send Transaction
        </button>
      </form>
    </div>
    <h5>
      Choose Network
      <div>
        <button @click="switchNetwork('5')">
          Switch MetaMask to Goerli Network
        </button>
        <button
          class="iopay-btn"
          @click="switchNetwork('4690')"
        >
          Switch MetaMask to IoTeX Network
        </button>
      </div>
    </h5>
    <h5>Logout</h5>
    <button @click="logout">
      logout
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import useContracts from '@/composables/contracts'
import useUsers from '@/composables/users'
import useWallet from '@/composables/wallet'

const message = ref('')
const signedMessage = ref('hi')

const metamaskButtonText = ref<string>('Connect Metamask')
const metamaskAccountsResult = ref<string>('Address Not Active')
const coinbaseButtonText = ref<string>('Connect Coinbase')
const coinbaseAccountsResult = ref<string>('Address Not Active')
const phantomButtonText = ref<string>('Connect Phantom')
const phantomAccountsResult = ref<string>('Address Not Active')
const ledgerButtonText = ref<string>('Connect Ledger')
const ledgerAccountsResult = ref<string>('Address Not Active')
const trezorButtonText = ref<string>('Connect Trezor')
const trezorAccountsResult = ref<string>('Address Not Active')
const walletConnectButtonText = ref<string>('Connect WalletConnect')
const walletConnectAccountsResult = ref<string>('Address Not Active')

const { user } = useUsers()

const {
  selectedProvider,
  selectedAddress,
  primaryAddress,
  toAddress,
  amount,
  amountToStake,
  logout,
  selectAddress,
  selectProvider,
  setPrimaryWalletAccount,
  sendTransaction,
  signMessage,
  removeConnectedAccount,
  switchNetwork
} = useWallet()

const { deposit, getPools, withdraw } = useContracts()

watchEffect(() => {
  if (selectedProvider.value === 'MetaMask') {
    metamaskButtonText.value = 'MetaMask Connected'
    metamaskAccountsResult.value = selectedAddress.value
    coinbaseButtonText.value = 'Connect Coinbase'
    coinbaseAccountsResult.value = 'Not Active'
    phantomButtonText.value = 'Connect Phantom'
    phantomAccountsResult.value = 'Not Active'
    ledgerButtonText.value = 'Connect Ledger'
    ledgerAccountsResult.value = 'Not Active'
    walletConnectButtonText.value = 'Connect WalletConnect'
    walletConnectAccountsResult.value = 'Not Active'
  } else if (selectedProvider.value === 'CoinbaseWallet') {
    metamaskButtonText.value = 'Connect Metamask'
    coinbaseButtonText.value = 'Coinbase Connected'
    metamaskAccountsResult.value = 'Not Active'
    coinbaseAccountsResult.value = selectedAddress.value
    phantomButtonText.value = 'Connect Phantom'
    phantomAccountsResult.value = 'Not Active'
    ledgerButtonText.value = 'Connect Ledger'
    ledgerAccountsResult.value = 'Not Active'
    walletConnectButtonText.value = 'Connect WalletConnect'
    walletConnectAccountsResult.value = 'Not Active'
  } else if (selectedProvider.value === 'IoPay') {
    metamaskButtonText.value = 'Connect MetaMask'
    coinbaseButtonText.value = 'Connect Coinbase'
    metamaskAccountsResult.value = 'Not Active'
    coinbaseAccountsResult.value = 'Not Active'
    phantomButtonText.value = 'Connect Phantom'
    phantomAccountsResult.value = 'Not Active'
    ledgerButtonText.value = 'Connect Ledger'
    ledgerAccountsResult.value = 'Not Active'
    walletConnectButtonText.value = 'Connect WalletConnect'
    walletConnectAccountsResult.value = 'Not Active'
  } else if (selectedProvider.value === 'Phantom') {
    metamaskButtonText.value = 'Connect MetaMask'
    coinbaseButtonText.value = 'Connect Coinbase'
    phantomButtonText.value = 'Connected'
    metamaskAccountsResult.value = 'Not Active'
    coinbaseAccountsResult.value = 'Not Active'
    phantomAccountsResult.value = selectedAddress.value || 'Not Active'
    ledgerButtonText.value = 'Connect Ledger'
    ledgerAccountsResult.value = 'Not Active'
    walletConnectButtonText.value = 'Connect WalletConnect'
    walletConnectAccountsResult.value = 'Not Active'
  } else if (selectedProvider.value === 'Ledger') {
    metamaskButtonText.value = 'Connect MetaMask'
    coinbaseButtonText.value = 'Connect Coinbase'
    phantomButtonText.value = 'Connected'
    metamaskAccountsResult.value = 'Not Active'
    coinbaseAccountsResult.value = 'Not Active'
    phantomAccountsResult.value = 'Not Active'
    ledgerButtonText.value = 'Connected!'
    ledgerAccountsResult.value = selectedAddress.value
    walletConnectButtonText.value = 'Connect WalletConnect'
    walletConnectAccountsResult.value = 'Not Active'
  } else if (selectedProvider.value === 'WalletConnect') {
    metamaskButtonText.value = 'Connect MetaMask'
    coinbaseButtonText.value = 'Connect Coinbase'
    phantomButtonText.value = 'Connected'
    metamaskAccountsResult.value = 'Not Active'
    coinbaseAccountsResult.value = 'Not Active'
    phantomAccountsResult.value = 'Not Active'
    ledgerButtonText.value = 'Connect Ledger'
    ledgerAccountsResult.value = 'Not Active'
    walletConnectButtonText.value = 'Connected!'
    walletConnectAccountsResult.value = selectedAddress.value
  } else if (selectedProvider.value === 'Trezor') {
    metamaskButtonText.value = 'Connect MetaMask'
    metamaskAccountsResult.value = 'Not Active'
    coinbaseButtonText.value = 'Connect Coinbase'
    coinbaseAccountsResult.value = 'Not Active'
    phantomButtonText.value = 'Connected'
    phantomAccountsResult.value = 'Not Active'
    ledgerButtonText.value = 'Connect Ledger'
    ledgerAccountsResult.value = 'Not Active'
    walletConnectButtonText.value = 'Connect WalletConnect'
    walletConnectAccountsResult.value = 'Not Active'
    trezorButtonText.value = 'Connected!'
    trezorAccountsResult.value = selectedAddress.value
  }
})
</script>

<style scoped>
.btn-save-remove-account {
  background-color: plum;
}

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

.brave-btn {
  background-color: rgb(228, 169, 123);
}

.coinbase-btn {
  background-color: blue;
}

.trust-btn {
  background-color: rgb(61, 61, 228);
}

.iopay-btn {
  background-color: rgb(0, 218, 180);
}

.ledger-btn {
  background-color: rgb(0, 0, 0);
}

.okx-btn {
  background-color: rgb(125, 1, 182);
}

.trezor-btn {
  background-color: rgb(34, 99, 55);
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

.wallet-connect-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  font-size: 16px;
  height: 44px;
  /* width: 50%; */
  transition: all 0.15s ease-in-out 0s;
  background-color: rgb(64, 153, 255);
  border: none;
  color: rgb(255, 255, 255);
  box-shadow: rgb(50 50 93 / 11%) 0px 4px 6px 0px,
    rgb(0 0 0 / 8%) 0px 1px 3px 0px, rgb(0 0 0 / 6%) 0px 0px 1px 0px inset;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  padding: 8px 12px;
  cursor: pointer;
  will-change: transform;
}

.network-div {
  /* Centered, chunky buttons, 500width */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid lightblue;
  padding: 2rem;
  width: 50%;
  /* center in middle of screen */
  margin-left: auto;
  margin-right: auto;

}
</style>
