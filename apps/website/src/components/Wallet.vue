<template>
  <div>
    <div class="metamask-div">
      <button ref="connectMetamaskButton">
        connect-metamask
      </button>
      <button ref="getAccountsButton">
        eth_accounts
      </button>
      <p>
        connected eth_accounts: <span ref="getAccountsResult">None yet</span>
      </p>
    </div>
    <!-- Allow user to connect coinbase wallet -->
    <div class="coinbase-div">
      <button ref="connectCoinbaseButton" class="coinbase-btn">
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, Ref, ref } from 'vue'
import MetaMaskOnboarding from '@metamask/onboarding'
const forwarderOrigin = 'http://localhost:9010'
const connectMetamaskButton: Ref = ref<HTMLDivElement>()
const getAccountsButton: Ref = ref<HTMLButtonElement>()
const getAccountsResult: Ref = ref<HTMLSpanElement>()
const ethereum: any = window.ethereum
onMounted(() => {
  const onboarding = new MetaMaskOnboarding({ forwarderOrigin })

  const onClickConnect = async () => {
    try {
      // Opens the MetaMask UI
      // TODO: Disable this button while the request is pending!
      // eslint-disable-next-line no-undef
      await ethereum.request({ method: 'eth_requestAccounts' })
      connectMetamaskButton.value.innerHTML = 'Metamask connected'
    } catch (error) {
      console.error(error)
    }
  }

  const onClickInstall = () => {
    console.log('onClickInstall')
    connectMetamaskButton.value.innerText =
      'Refresh page after installing Metamask'
    connectMetamaskButton.value.disabled = true
    // Starts the onboarding process for our end user
    onboarding.startOnboarding()
  }

  if (!isMetaMaskInstalled()) {
    connectMetamaskButton.value.innerText = 'Click here to install MetaMask!'
    connectMetamaskButton.value.onclick = onClickInstall
    connectMetamaskButton.value.disabled = false
  } else {
    connectMetamaskButton.value.innerText = 'Connect Metamask'
    connectMetamaskButton.value.onclick = onClickConnect
    connectMetamaskButton.value.disabled = false
  }

  getAccountsButton.value.addEventListener('click', async () => {
    // eslint-disable-next-line no-undef
    const accounts = await ethereum.request({ method: 'eth_accounts' })
    // TODO: Determine how to get other accounts not currently selected in metamask UI
    if (accounts.length > 0) {
      accounts.forEach((account: string) => {
        getAccountsResult.value.innerText = ''
        const p = document.createElement('p')
        p.innerText = account
        getAccountsResult.value.appendChild(p)
      })
    } else {
      getAccountsResult.value.innerText = 'No accounts found'
    }
  })
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
