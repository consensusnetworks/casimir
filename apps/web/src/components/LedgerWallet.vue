<template>
  <div class="container">
    <h1>
      Connect your Nano and open the Bitcoin app. Click button to start...
    </h1>
    <button @click="connectLedgerBtc">Click to Connect BTC Account</button>
    <h3>
      Your address:
      <span>{{ btcAddress }}</span>
    </h3>
    <button @click="connectLedgerEth">Click to Connect ETH Account</button>
    <h3>
      Your address:
      <span>{{ ethAddress }}</span>
    </h3>
    <button @click="createNewTransaction">Create Transaction</button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import 'core-js/actual'
import TransportWebUSB from '@ledgerhq/hw-transport-webusb'
import { getWalletPublicKey } from '@ledgerhq/hw-app-btc/lib/getWalletPublicKey'
import { createTransaction } from '@ledgerhq/hw-app-btc/lib/createTransaction'
import { listen } from '@ledgerhq/logs'
import Eth from '@ledgerhq/hw-app-eth'
// import Btc from '@ledgerhq/hw-app-btc'
// import TransportWebHID from "@ledgerhq/hw-transport-webhid";

const btcAddress = ref('Not yet connected')
const ethAddress = ref('Not yet connected')

async function connectLedgerBtc() {
  try {
    listen((log) => console.log(log))
    const transport = await TransportWebUSB.create()

    const options = {
      path: "44'/0'/0'/0/0",
      verify: false,
      format: 'legacy',
    }
    const { bitcoinAddress } = await getWalletPublicKey(transport, options)
    btcAddress.value = bitcoinAddress

    // TODO: Figure out why this is failing (this was how docs suggested to do it)
    // When the Ledger device connected it is trying to display the bitcoin address
    // const btc = new Btc(transport)
    // const { bitcoinAddress } = await btc.getWalletPublicKey("44'/0'/0'/0/0")
    // console.log('bitcoinAddress', bitcoinAddress)
    // address.value = bitcoinAddress
  } catch (e) {
    console.log('error: ', e)
  }
}

async function connectLedgerEth() {
  try {
    listen((log) => console.log(log))
    const transport = await TransportWebUSB.create()
    const eth = new Eth(transport)

    const path = "44'/60'/0'/0/0"
    const boolDisplay = false
    const boolChaincode = true

    const { address, chainCode, publicKey } = await eth.getAddress(
      path,
      boolDisplay,
      boolChaincode
    )
    ethAddress.value = address
  } catch (e) {
    console.log('error: ', e)
  }
}

async function createNewTransaction() {
  const transport = await TransportWebUSB.create()
  /** Example arguments for createTransaction
   * inputs: [ [tx1, 1] ],
   * associatedKeysets: ["0'/0/0"],
   * outputScriptHex: "01905f0100000000001976a91472a5d75c8d2d0565b656a5232703b167d50d5a2b88ac"
   */
  //   const txArgs = {
  //     inputs: Array<
  //     [Transaction, number, string | null | undefined, number | null | undefined]
  //   >;
  //     associatedKeysets: string[];
  //   changePath?: string;
  //   outputScriptHex: string;
  //   lockTime?: number;
  //   sigHashType?: number;
  //   segwit?: boolean;
  //   initialTimestamp?: number;
  //   additionals: Array<string>;
  //   expiryHeight?: Buffer;
  //   useTrustedInputForSegwit?: boolean;
  //   }
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
h1 {
  text-align: center;
  font-size: 1.5rem;
}

button {
  padding: 10px;
  margin: 10px;
  border-radius: 5px;
  border: 1px solid #000;
  background-color: #fff;
  cursor: pointer;
}
</style>
