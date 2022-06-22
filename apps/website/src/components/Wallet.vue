<template>
  <div>
    <button id="connect-metamask">
      connect-metamask
    </button>
    <button id="getAccounts">
      eth_accounts
    </button>

    <p id="eth-accounts">
      connected eth_accounts: <span id="getAccountsResult">None yet</span>
    </p>
    <form @submit.prevent="transfer">
      <div class="form-group">
        <input
          id="recipientAddress"
          v-model="recipientAddress"
          type="text"
          class="form-control"
          placeholder="To Address"
        />
        <input
          id="amount"
          v-model="amount"
          type="text"
          class="form-control"
          placeholder="Amount"
        />
        <button @click="transfer(recipientAddress, amount)">
          Transfer
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import MetaMaskOnboarding from '@metamask/onboarding'
const forwarderOrigin = 'http://localhost:9010'

onMounted(() => {
  const connectMetamaskButton = document.getElementById('connect-metamask')
  const getAccountsButton = document.getElementById('getAccounts')
  const getAccountsResult = document.getElementById('getAccountsResult')

  const onboarding = new MetaMaskOnboarding({ forwarderOrigin })

  const onClickConnect = async () => {
    try {
      // Opens the MetaMask UI
      // TODO: Disable this button while the request is pending!
      // eslint-disable-next-line no-undef
      await ethereum.request({ method: 'eth_requestAccounts' })
      connectMetamaskButton.innerHTML = 'Metamask connected'
    } catch (error) {
      console.error(error)
    }
  }

  const onClickInstall = () => {
    console.log('onClickInstall')
    connectMetamaskButton.innerText = 'Refresh page after installing Metamask'
    connectMetamaskButton.disabled = true
    // Starts the onboarding process for our end user
    onboarding.startOnboarding()
  }

  if (!isMetaMaskInstalled()) {
    connectMetamaskButton.innerText = 'Click here to install MetaMask!'
    connectMetamaskButton.onclick = onClickInstall
    connectMetamaskButton.disabled = false
  } else {
    connectMetamaskButton.innerText = 'Connect Metamask'
    connectMetamaskButton.onclick = onClickConnect
    connectMetamaskButton.disabled = false
  }

  getAccountsButton.addEventListener('click', async () => {
    // eslint-disable-next-line no-undef
    const accounts = await ethereum.request({ method: 'eth_accounts' })
    // TODO: Determine how to get other accounts not currently selected in metamask UI
    if (accounts.length > 0) {
      accounts.forEach((account) => {
        getAccountsResult.innerText = ''
        const p = document.createElement('p')
        p.innerText = account
        getAccountsResult.appendChild(p)
      })
    } else {
      getAccountsResult.innerText = 'No accounts found'
    }
  })
})

const isMetaMaskInstalled = () => {
  const { ethereum } = window
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
</style>
