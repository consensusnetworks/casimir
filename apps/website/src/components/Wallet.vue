<template>
  <!-- Create crypto wallet component -->
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

    <div class="metamask-not-installed-message">
      Metamask is not installed
    </div>
    <form @submit.prevent="transfer">
      <div class="horizontal-container">
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
      </div>
      <!-- <div class="form-group">
      <button @click="stake">
        Stake
      </button>
    </div> -->
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MetaMaskOnboarding from '@metamask/onboarding'
let currentUrl
const forwarderOrigin = 'http://localhost:9010'
// currentUrl.hostname === 'localhost' ? 'http://localhost:9010' : undefined

onMounted(() => {
  const connectMetamaskButton = document.getElementById('connect-metamask')
  const getAccountsButton = document.getElementById('getAccounts')
  const getAccountsResult = document.getElementById('getAccountsResult')
  //We create a new MetaMask onboarding object to use in our app
  const onboarding = new MetaMaskOnboarding({ forwarderOrigin })

  const onClickConnect = async () => {
    try {
      // Will open the MetaMask UI
      // You should disable this button while the request is pending!
      // eslint-disable-next-line no-undef
      await ethereum.request({ method: 'eth_requestAccounts' })
      connectMetamaskButton.innerHTML = 'Metamask connected'
    } catch (error) {
      console.error(error)
    }
  }

  //This will start the onboarding proccess
  const onClickInstall = () => {
    console.log('onClickInstall')
    connectMetamaskButton.innerText = 'Refresh page after installing Metamask'
    connectMetamaskButton.disabled = true
    //On this object we have startOnboarding which will start the onboarding process for our end user
    onboarding.startOnboarding()
  }

  if (!isMetaMaskInstalled()) {
    connectMetamaskButton.innerText = 'Click here to install MetaMask!'
    //When the button is clicked we call this function
    connectMetamaskButton.onclick = onClickInstall
    //The button is now disabled
    connectMetamaskButton.disabled = false
  } else {
    connectMetamaskButton.innerText = 'Connect Metamask'
    //When the button is clicked we call this function to connect the users MetaMask Wallet
    connectMetamaskButton.onclick = onClickConnect
    //The button is now disabled
    connectMetamaskButton.disabled = false
  }

  getAccountsButton.addEventListener('click', async () => {
    //we use eth_accounts because it returns a list of addresses owned by us.
    // eslint-disable-next-line no-undef
    const accounts = await ethereum.request({ method: 'eth_accounts' })
    console.log('accounts.length :>> ', accounts.length)
    if (accounts.length > 0) {
      // For each account, append a p element to id="eth-accounts"
      accounts.forEach((account) => {
        getAccountsResult.innerText = ''
        const p = document.createElement('p')
        p.innerText = account
        getAccountsResult.appendChild(p)
      })
    } else {
      getAccountsResult.innerText = 'No accounts found'
    }
    //We take the first address in the array of addresses and display it
    // getAccountsResult.innerHTML =
    //   accounts[0] || 'Not able to get accounts'
  })

  // connectMetamaskButton.addEventListener('click', () => {
  //   if (typeof window.ethereum !== 'undefined') {
  //     console.log('MetaMask is installed!')
  //   } else {
  //     displayMetamaskNotInstalledMessage()
  //   }
  //   // eslint-disable-next-line no-undef
  //   ethereum.request({ method: 'eth_requestAccounts' })
  // })
})

const isMetaMaskInstalled = () => {
  const { ethereum } = window
  return Boolean(ethereum && ethereum.isMetaMask)
}

const displayMetamaskNotInstalledMessage = () => {
  const metamaskNotInstalledMessage = document.querySelector(
    '.metamask-not-installed-message'
  )
  metamaskNotInstalledMessage.style.display = 'flex'
}
</script>

<style scoped>
.horizontal-container {
  /* display: flex; */
  display: none;
  flex-direction: row;
}

.metamask-not-installed-message {
  display: none;
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
  /* chunky submit button */
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
