<script setup>
import { ref } from 'vue'
import VueFeather from 'vue-feather'
import useAuth from '@/composables/auth'
import useFormat from '@/composables/format'
import useScreenDimensions from '@/composables/screenDimensions'
import useUser from '@/composables/user'
import useEthers from '@/composables/ethers'
import useLedger from '@/composables/ledger'
import useTrezor from '@/composables/trezor'
import useWalletConnect from '@/composables/walletConnectV2'
import LoaderSpinner from '@/components/LoaderSpinner.vue'

const activeWallets = [
    'MetaMask',
    'CoinbaseWallet',
    'WalletConnect',
    'Trezor',
    'Ledger',
    'TrustWallet',
    // 'IoPay',
]

const flowState = ref('select_address')
const errorMessage = ref(false)
const walletProviderAddresses = ref([])

const selectedProvider = ref(null)


const { login, logout } = useAuth()
const { ethersProviderList, getEthersAddressesWithBalances } = useEthers()
const { screenWidth } = useScreenDimensions()
const { convertString, trimAndLowercaseAddress } = useFormat()
const { getLedgerAddress } = useLedger()
const { getTrezorAddress } = useTrezor()
const { user } = useUser()
const { connectWalletConnectV2 } = useWalletConnect()
/**
 * Sets the selected provider and returns the set of addresses available for the selected provider
 * @param provider 
 * @param currency 
*/
async function selectProvider(provider, currency = 'ETH') {
    console.clear()
    try {
        if (provider === 'WalletConnect') {
            walletProviderAddresses.value = await connectWalletConnectV2('5')
        } else if (ethersProviderList.includes(provider)) {
            walletProviderAddresses.value = await getEthersAddressesWithBalances(provider)
        } else if (provider === 'Ledger') {
            walletProviderAddresses.value = await getLedgerAddress[currency]()
        } else if (provider === 'Trezor') {
            walletProviderAddresses.value = await getTrezorAddress[currency]()
        }
        flowState.value = 'select_address'
    } catch (error) {
        errorMessage.value = true
        throw new Error(`Error selecting provider: ${error.message}`)
    }
}
</script>

<template>
  <div class="card">
    <!-- SECTION: SELECT PROVIDER  or  ADD ACCOUNT -->
    <section v-if="flowState === 'select_provider' || flowState === 'add_account'">
      <div v-if="flowState === 'select_provider'">
        <h1 class="mb-[15px]">
          Connect wallet
        </h1>
        <p class="">
          Select a wallet provider
          <span class=" inline-block mt-10">
            Connecting a wallet allows us to create an account under your wallet for you.
          </span>
        </p>
      </div>

      <div v-if="flowState === 'add_account'">
        <h1 class="mb-[15px]">
          Add secondary account
        </h1>
        <p class="">
          Select a wallet provider
          <span class=" inline-block mt-10">
            Connecting a wallet will add the wallet under your primary account
          </span>
        </p>
      </div>

      <div class="mt-15">
        <div
          v-for="wallet in activeWallets"
          :key="wallet"
          class="flex items-center gap-5"
        >
          <!-- TODO: @Chris need a way to find out if the extenstion is not downloaded -->
          <div
            v-show="Math.random() < 0.5"
            class="tooltip_container text-white"
          >
            <vue-feather
              type="alert-circle"
              class="text-primary/40 hover:text-primary/75 h-[20px] w-[20px] mb-5"
            />
            <div class="tooltip w-[260px]">
              You currently do not have the extension for this wallet provider connected, click the button
              to take you to the wallet provider extension page.
            </div>
          </div>
          <button
            class="connect_wallet_btn"
            @click="selectProvider(wallet, 'ETH')"
          >
            <img
              :src="`/${wallet.toLowerCase()}.svg`"
              :alt="`${wallet} logo`"
              class=""
            >
            <h6>
              {{ wallet }}
            </h6>
          </button>
        </div>
      </div>
      <div class="h-15 w-full text-[11px] font-[500] mb-5 text-decline">
        <span v-show="errorMessage">
          Something went wrong, please try again later.
        </span>
      </div>
      <div>
        <p>
          <span>
            Note: Once connected, you will be able to view this wallet by connecting your primary account
          </span>
        </p>
      </div>
    </section>

    <!-- SECTION: SELECT ADDRESS -->
    <section v-else-if="flowState === 'select_address'">
      <div>
        <h1 class="mb-[15px]">
          Connect wallet
        </h1>
        <p class="">
          Select a wallet address
          <span class=" inline-block mt-10">
            Selecting a wallet allows us connect to a your active account.
          </span>
        </p>
      </div>

      <div class="mt-15 h-[250px] overflow-y-auto overflow-x-hidden">
        <div
          v-if="walletProviderAddresses.length === 0"
          class="text-[16px] font-[500]"
        >
          <button
            class="w-full text-[14px] flex items-center gap-5 text-primary mb-10 hover:text-primary/60"
            @click="flowState = 'select_provider'"
          >
            <vue-feather
              type="arrow-left-circle"
              class="w-[20px] h-[20px]"
            />
            Back to provider selection
          </button>
          We do not see any available addresses, please connect or create a wallet to your {{ selectedProvider }}
        </div>

        <button
          v-else
          class="w-full text-[14px] flex items-center gap-5 text-primary mb-10 hover:text-primary/60"
          @click="flowState = 'select_provider'"
        >
          <vue-feather
            type="arrow-left-circle"
            class="w-[14px] h-[14px] mb-2"
          />
          back
        </button>

        <div
          v-for="act in walletProviderAddresses"
          :key="act"
          class="flex items-center gap-5"
        >
          <div
            v-if="checkIfAddressIsUsed(act)"
            class="tooltip_container text-white"
          >
            <vue-feather
              type="alert-circle"
              class="text-warning/40 hover:text-warning/75 h-[20px] w-[20px] mb-5"
            />
            <div class="tooltip w-[260px]">
              This address is already connected!
            </div>
          </div>
          <button
            class="connect_wallet_btn"
            :disable="checkIfAddressIsUsed(act)"
            @click="selectAddress(act.address)"
          >
            <div>
              {{ convertString(act.address) }}
            </div>
            <div>
              {{ parseFloat(parseFloat(act.balance).toFixed(2)) }} ETH
            </div>
          </button>
        </div>
      </div>

      <div class="h-15 w-full text-[11px] font-[500] mb-5 text-decline">
        <span v-show="errorMessage">
          Something went wrong, please try again later.
        </span>
      </div>
      <div>
        <p>
          <span>
            Note: Make sure you have the address that you want to connect active.
          </span>
        </p>
      </div>
    </section>



    <!-- SECTION: LOADING -->
    <section
      v-else-if="flowState === 'loading'"
      class="w-full h-full"
    >
      <div class="flex flex-col items-center justify-center h-full w-full gap-5">
        <vue-feather
          type="loader"
          class="icon w-[45px] h-min text-primary animate-spin "
          style="animation-duration: 3s;"
        />
        <p>
          Waiting on confirmation of signature
        </p>
      </div>
    </section>


    <!-- SECTION: SUCCESS -->
    <section
      v-else-if="flowState === 'success'"
      class="w-full h-full"
    >
      <div class="flex flex-col items-center justify-center h-full w-full gap-5">
        <vue-feather
          type="check-circle"
          class="icon w-[45px] h-min text-approve"
        />
        <p>
          Confirmation successful, wallet connected!
        </p>
      </div>
    </section>

    <!-- SECTION: CONFIRMING SIGNAGE WITH AN EXISTING SECONDARY ACCOUNT -->
    <section
      v-else-if="flowState === 'confirm_signage_with_existing_secondary'"
      class="w-full h-full"
    >
      <div>
        <h1 class="mb-[15px]">
          Confirm Signage
        </h1>
        <p class="">
          The current wallet you are trying to connect exists under another primary wallet.
        </p>
      </div>

      <div class="mt-15 h-[230px] w-full flex items-center justify-center gap-5">
        <button class="action_button_cancel flex items-center justify-center gap-5 w-full">
          <vue-feather
            type="arrow-left-circle"
            class="icon w-[16px] h-min"
          />
          Back
        </button>
        <button class="action_button w-full">
          Confirm
        </button>
      </div>
      <div class="h-15 w-full text-[11px] font-[500] mb-5 text-decline">
        <span v-show="errorMessage">
          Something went wrong, please try again later.
        </span>
      </div>
      <div>
        <p>
          Note: Connecting this address will create a new account, you can still access your previous account by
          connecting with said account primary address
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.action_button_cancel {
    background-color: #f3f5f8;
    border: 1px solid #ebebed;
    border-radius: 5px;
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 600;
    font-size: 12px;
    line-height: 20px;
    letter-spacing: 0.45px;
    letter-spacing: -0.01em;
    color: #5b5c5f;
    padding: 4px 0px;
}

.action_button_cancel:hover {
    border: 1px solid #e6e6e7;
    box-shadow: 0px 0px 10px 0px rgba(116, 116, 123, 0.18);
}

.action_button {
    background-color: #0D5FFF;
    border: 1px solid #ebebed;
    border-radius: 5px;
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 600;
    font-size: 12px;
    line-height: 20px;
    letter-spacing: 0.45px;
    color: #efefef;
    padding: 4px 0px;
}

.action_button:hover {
    border: 1px solid #e6e6e7;
    box-shadow: 0px 0px 10px 0px rgba(116, 116, 123, 0.28);
}

.connect_wallet_btn {
    width: 100%;
    border: 1px solid #ebebed;
    background-color: #f3f5f8;
    display: flex;
    justify-content: space-between;
    align-content: center;
    align-items: center;
    padding: 5px 8px;
    border-radius: 5px;

    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 20px;
    letter-spacing: -0.01em;
    color: #5b5c5f;
    margin: 0 0 10px 0;
}

.connect_wallet_btn:hover {
    border: 1px solid #e6e6e7;
    box-shadow: 0px 3px 6px 0px rgba(116, 116, 123, 0.18);
}

.connect_wallet_btn:disabled {
    opacity: 0.5;
}

.connect_wallet_btn:disabled:hover {
    opacity: 0.5;
    cursor: not-allowed;
    border: 1px solid #df2d2d24;
    box-shadow: 0px 3px 6px 0px rgba(235, 67, 5, 0.18);
}

.connect_wallet_btn img {
    width: 20px;
    height: 20px;
    border-radius: 3px;
}

.card {
    background-color: white;
    padding: 10px 20px 30px 20px;
    width: 300px;
    height: 446px;
    border-radius: 5px;
    box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03);
}

.card h1 {
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 20px;
    color: #344054;
}

.card p {

    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 20px;
    letter-spacing: -0.01em;
    color: #667085;
}

.card p span {

    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 11px;
    line-height: 14px;
    letter-spacing: -0.01em;
    color: #667085;
}
</style>