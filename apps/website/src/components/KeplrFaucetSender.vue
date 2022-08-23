<template>
  <div>
    <fieldset>
      <legend>Faucet</legend>
      <p>Address: {{ faucetAddress }}</p>
      <p>Balance: {{ faucetBalance }}</p>
    </fieldset>
    <fieldset>
      <legend>You</legend>
      <p>Address: {{ myAddress }}</p>
      <p>Balance: {{ myBalance }}</p>
    </fieldset>
    <fieldset>
      <legend>Send</legend>
      <p>To faucet:</p>
      <input
        value="{{toSend}}"
        type="number"
        @model="onToSendChanged"
      >
      {{ denom }}
      <button @click="onSendClicked">
        Send to faucet
      </button>
      <button @click="updateFaucetBalance">
        Update faucet balance
      </button>
    </fieldset>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { StargateClient } from '@cosmjs/stargate'

// export interface FaucetSenderProps {
//     faucetAddress: string
//     url: string
// }

// interface FaucetSenderState {
//     denom: string
//     faucetBalance: string
//     myAddress: string
//     myBalance: string
//     toSend: string
// }

const denom = ref('Loading...')
const faucetBalance = ref('Loading...')
const myAddress = ref('Click first')
const myBalance = ref('Click first')
const toSend = ref('0')
const faucetAddress = 'cosmos15aptdqmm7ddgtcrjvc5hs988rlrkze40l4q0he'
const rpcUrl = 'https://rpc.testnet.cosmos.network:443'

// TODO: Potentially add an onMounted hook to update the faucet balance per section above this: https://tutorials.cosmos.network/academy/xl-cosmjs/with-keplr.html#getting-testnet-tokens

// Store changed token amount to state
function onToSendChanged(e) {
  toSend.value = e.currentTarget.value
}

// When the user clicks the "send to faucet button"
async function onSendClicked(e) {
  alert('TODO')
}

// Get the faucet's balance
async function updateFaucetBalance() {
  const client = await StargateClient.connect(rpcUrl)
  console.log('client :>> ', client)
  // const balances: readonly Coin[] = await client.getAllBalances(faucetAddress)
  // const first: Coin = balances[0]
  // denom.value = first.denom
  // faucetBalance.value = first.amount
}
</script>

<style>
button {
  font-size: 1.5em;
  font-weight: bold;
  padding: 0.5em 1em;
  border: 2px solid #ccc;
  border-radius: 3px;
  background: #eee;
  cursor: pointer;
}
</style>
