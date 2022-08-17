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
      <input value="{{toSend}}" type="number" @model="onToSendChanged" />
      {{ denom }}
      <button @click="onSendClicked">Send to faucet</button>
    </fieldset>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// export interface FaucetSenderProps {
//     faucetAddress: string
//     rpcUrl: string
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
const rpcUrl = 'https://rpc.sentry-01.theta-testnet.polypore.xyz'

// Store changed token amount to state
function onToSendChanged(e) {
  toSend.value = e.currentTarget.value
}

// When the user clicks the "send to faucet button"
async function onSendClicked(e) {
  alert('TODO')
}
</script>

<style>
button {
  /* chunky button */
}
</style>
