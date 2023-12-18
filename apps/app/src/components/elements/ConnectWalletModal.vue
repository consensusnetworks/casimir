<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import {
    TransitionRoot,
    TransitionChild,
    Dialog,
    DialogPanel,
} from "@headlessui/vue"
import useConnectWalletModal from "@/composables/state/connectWalletModal"
import Loading from "@/components/elements/Loading.vue"
import Success from "@/components/elements/Success.vue"
import Failure from "@/components/elements/Failure.vue"
import useAuth from "@/composables/services/auth"
import useWallets from "@/composables/services/wallets"
import { CryptoAddress, ProviderString } from "@casimir/types"

const { login } = useAuth()
const { openConnectWalletModal, toggleConnectWalletModal } = useConnectWalletModal()
const { detectActiveNetwork, switchEthersNetwork } = useWallets()

// type UserAuthFlowState = 
//   "select_provider"
//   | "select_address" 
//   | "loading" 
//   | "success" 
//   | "add_account" 
//   | "confirm_signage_with_existing_secondary" 
//   | "connection_failed"


const flowState = ref("select_provider")

const errorMessage = ref(false)
const errorMessageText = ref("Something went wrong, please try again later.")
const selectProviderLoading = ref(false)
const selectedProvider = ref<ProviderString>("")
const walletProviderAddresses = ref([] as CryptoAddress[])

const supportedWalletProviders = [
    "MetaMask",
    "CoinbaseWallet",
    "WalletConnect",
    "Trezor",
    "Ledger",
    "TrustWallet",
    // 'IoPay',
]

async function selectProvider(provider: ProviderString): Promise<void> {
    console.clear()
    try {
        selectedProvider.value = provider
        selectProviderLoading.value = true
    
        // Hard Goerli Check
        // TODO: Make this dynamic
        if (provider !== "WalletConnect") {
            const activeNetwork = await detectActiveNetwork(selectedProvider.value as ProviderString)
            if (activeNetwork !== 5) {
                await switchEthersNetwork(selectedProvider.value, "0x5")
                return window.location.reload()
            }
        }

        if (provider === "WalletConnect") {
            // TODO: @@cali1 - pass in the network id dynamically
            walletProviderAddresses.value = await connectWalletConnectV2(requiredNetwork) as CryptoAddress[]
        } else if (browserProvidersList.includes(provider)) {
            walletProviderAddresses.value = await getEthersAddressesWithBalances(provider) as CryptoAddress[]
        } else if (provider === "Ledger") {
            walletProviderAddresses.value = await getEthersLedgerAddresses() as CryptoAddress[]
        } else if (provider === "Trezor") {
            walletProviderAddresses.value = await getEthersTrezorAddresses() as CryptoAddress[]
        } else {
            throw new Error("Provider not supported")
        }
        errorMessage.value = false
        errorMessageText.value = ""
        selectProviderLoading.value = false
        flowState.value = "select_address"
    } catch (error: any) {
        errorMessage.value = true
        if (provider === "Ledger") {
            const { message, name, statusCode } = error
            if (
                message === "Ledger device: UNKNOWN_ERROR (0x6511)" 
              && name === "TransportStatusError" 
              && statusCode === 25873
            ) {
                errorMessageText.value = "Unlock your Ledger and open Ethereum Goerli app."
                selectProviderLoading.value = false
            }
        } else if (provider === "Trezor") {
            if (error.message.includes("Trezor Suite is not open")) {
                errorMessageText.value = "Open your Trezor Suite desktop app."
                selectProviderLoading.value = false
            } else {
                console.log("Error in selectProvider :>> ", error)
                errorMessageText.value = "Something went wrong with your Trezor connection, please try again later."
                selectProviderLoading.value = false
            }
        } else {
            console.log("error in selectProvider in ConnectWalletsFlow.vue :>> ", error)
            errorMessageText.value = "Something went wrong, please try again later."
            selectProviderLoading.value = false
        }
    }
}

function closeModal() {
    toggleConnectWalletModal(false)
}

function handleOuterClick(event) {
    const modal_container = document.getElementById("connect_wallet_modal")
    if (
        modal_container && 
        !modal_container.contains(event.target)
    ) {
        closeModal()
    }
}
</script>

<template>
  <TransitionRoot
    appear
    :show="openConnectWalletModal? true : false"
    as="template"
  >
    <Dialog
      as="div"
      class="relative z-10"
      @mousedown="handleOuterClick"
      @close="closeModal"
    >
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div
          class="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-[2px]"
        />
      </TransitionChild>
    
      <div class="fixed inset-0 overflow-y-auto">
        <div
          class="flex min-h-full items-center justify-center p-4 text-center"
        >
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              id="connect_wallet_modal"
  
              class="connect_wallet_card transition-all"
            >
              <!-- SECTION: SELECT PROVIDER  or  ADD ACCOUNT -->
              <section v-if="flowState === 'select_provider' || flowState === 'add_account'">
                <div>
                  <h1 class="card_title">
                    {{ flowState === 'select_provider'? 'Connect Wallet' : 'Add Wallet' }}
                  </h1>
                  <p class="card_subtitle">
                    Select a wallet provider
                  </p>
                </div>
  
                <div class="mt-[20px]">
                  <div
                    v-for="walletProvider in supportedWalletProviders"
                    :key="walletProvider"
                    class="mb-[12px]"
                  >
                    <button
                      class="flex items-center justify-between gap-5 w-full border relative px-[12px] py-[8px] shadow
                        rounded-[6px] bg-lightBg dark:bg-darkBg border-lightBorder dark:border-lightBorder/40
                        hover:bg-hover_white dark:hover:bg-hover_black"
                      :disabled="selectProviderLoading"
                    >
                      <!-- TODO: Add this loading shine back once we enable it -->
                      <!-- <div :class="selectedProvider === walletProvider && selectProviderLoading ? 'loading' : 'hidden'" /> -->
                      <img
                        :src="`/${walletProvider.toLowerCase()}.svg`"
                        :alt="`${walletProvider} logo`"
                        class="w-[20px] h-[20px]"
                      >
                      <small>
                        {{ walletProvider }}
                      </small>
                    </button>
                    <!-- TODO: @Chris need a way to find out if the extenstion is not downloaded -->
                    <!-- <div
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
                      </div> -->
                  </div>
                </div>
                <div class="h-15 w-full text-[11px] font-[500] mb-5 text-decline">
                  <span v-show="errorMessage">
                    {{ errorMessageText }}
                  </span>
                </div>
                <div class="w-full">
                  <small
                    v-show="flowState === 'select_provider'"
                    class="w-full text-[11.11px]"
                  >
                    Connecting a wallet will create a primary wallet that you 
                    can connect again to retrieve your data
                  </small>
                  <small
                    v-show="flowState === 'add_account'"
                    class="w-full text-[11.11px]"
                  >
                    Connecting a wallet will create a secondary wallet that is
                    under your primary wallet
                  </small>
                </div>
              </section>
  
              <!-- SECTION: SELECT ADDRESS -->
              <section v-else-if="flowState === 'select_address'">
                <div>
                  <h1 class="mb-[15px]">
                    Select Wallet
                  </h1>
                  <p class="">
                    Select the wallet address you want to connect
                  </p>
                </div>
  
                <div class="mt-15 h-[240px] overflow-y-auto overflow-x-hidden">
                  <!-- TODO: Add back once available -->
                  <!-- <div
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
                  </div> -->
  
                  <!-- <button
                    v-else
                    class="w-full text-[14px] flex items-center gap-5 text-primary mb-10 hover:text-primary/60"
                    @click="flowState = 'select_provider'"
                  >
                    <vue-feather
                      type="arrow-left-circle"
                      class="w-[14px] h-[14px] mb-2"
                    />
                    back
                  </button> -->
  
                  <!-- <div
                    v-for="(act, pathIndex) in walletProviderAddresses"
                    :key="pathIndex"
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
                      :disabled="checkIfAddressIsUsed(act)"
                      @click="
                        selectedProvider === 'Ledger' || selectedProvider === 'Trezor' ?
                          selectAddress(trimAndLowercaseAddress(act.address), pathIndex) :
                          selectAddress(trimAndLowercaseAddress(act.address), undefined)
                      "
                    >
                      <div>
                        {{ convertString(act.address) }}
                      </div>
                      <div>
                        {{ formatEthersCasimir(parseFloat(act.balance)) }} ETH
                      </div>
                    </button>
                  </div> -->
                </div>
  
                <div class="h-15 w-full text-[11px] font-[500] mb-5 text-decline">
                  <span v-show="errorMessage">
                    {{ errorMessageText }}
                  </span>
                </div>
                <div class="w-full">
                  <small
                    v-show="flowState === 'select_provider'"
                    class="w-full text-[11.11px]"
                  >
                    Make sure you have the address that you want to connect active.
                  </small>
                </div>
              </section>
  
              <!-- SECTION: LOADING -->
              <section
                v-else-if="flowState === 'loading'"
                class="w-full h-full"
              >
                <div class="flex flex-col items-center justify-center h-full w-full gap-5">
                  <div class="h-[74px] w-[74px]">
                    <Loading :show-text="false" />
                  </div>
                  
                  <div class="w-full text-center">
                    <small
                      class="w-full card_title"
                    >
                      Waiting on signature
                    </small>
                  </div>
                </div>
              </section>
  
              <!-- SECTION: SUCCESS -->
              <section
                v-else-if="flowState === 'success'"
                class="w-full h-full"
              >
                <div class="flex flex-col items-center justify-center h-full w-full gap-5">
                  <div class="h-[150px] w-[150px]">
                    <Success />
                  </div>
                  
                  <div class="w-full text-center">
                    <small
                      class="w-full card_title"
                    >
                      <span class="text-green">Wallet Connected!</span>
                    </small>
                  </div>
                </div>
              </section>
  
              <!-- SECTION: CONNECTION FAILED -->
              <section
                v-else-if="flowState === 'connection_failed'"
                class="w-full h-full"
              >
                <div class="flex flex-col items-center justify-center h-full w-full gap-5">
                  <div class="h-[150px] w-[150px]">
                    <Failure />
                  </div>
                  
                  <div class="w-full text-center">
                    <small
                      class="w-full card_title"
                    >
                      <span class="text-red">
                        Something went wrong, try again later
                      </span>
                    </small>
                  </div>
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
                  <p>
                    The current wallet you are trying to connect exists under another primary wallet or is a primary account.
                  </p>
                  <br>
                  <p>Would you like to create a new account with this address as the primary wallet address?</p>
                </div>
  
                <div class="mt-15 h-[220px] w-full flex items-center justify-center gap-5">
                  <button
                    class="action_button_cancel flex items-center justify-center gap-5 w-full"
                    @click="flowState = 'select_address'"
                  >
                    <!-- <vue-feather
                      type="arrow-left-circle"
                      class="icon w-[16px] h-min"
                    /> -->
                    Back
                  </button>
                  <button
                    class="action_button w-full"
                    @click="handleConfirmCreateAccountWithExistingSecondary"
                  >
                    Create Account
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
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
  
  
<style scoped>
.loading {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.5) 50%, rgba(255, 255, 255, 0) 100%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}
</style>