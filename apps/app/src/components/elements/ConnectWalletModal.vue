<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import {
    TransitionRoot,
    TransitionChild,
    Dialog,
    DialogPanel,
} from "@headlessui/vue"
import useConnectWalletModal from "@/composables/state/connectWalletModal"

const { openConnectWalletModal, toggleConnectWalletModal } = useConnectWalletModal()

function closeModal() {
    toggleConnectWalletModal(false)
}


const flowState = ref("add_account")

const errorMessage = ref(false)
const errorMessageText = ref("Something went wrong, please try again later.")
const selectProviderLoading = ref(false)

const supportedWalletProviders = [
    "MetaMask",
    "CoinbaseWallet",
    "WalletConnect",
    "Trezor",
    "Ledger",
    "TrustWallet",
    // 'IoPay',
]

const handleOuterClick = (event) =>{
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
              <!-- <section v-else-if="flowState === 'select_address'">
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
  
                  <div class="mt-15 h-[240px] overflow-y-auto overflow-x-hidden">
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
                    </div>
                  </div>
  
                  <div class="h-15 w-full text-[11px] font-[500] mb-5 text-decline">
                    <span v-show="errorMessage">
                      {{ errorMessageText }}
                    </span>
                  </div>
                  <div>
                    <p>
                      <span>
                        Note: Make sure you have the address that you want to connect active.
                      </span>
                    </p>
                  </div>
                </section> -->
  
              <!-- SECTION: LOADING -->
              <!-- <section
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
                </section> -->
  
              <!-- SECTION: SUCCESS -->
              <!-- <section
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
                </section> -->
  
              <!-- SECTION: CONNECTION FAILED -->
              <!-- <section
                  v-else-if="flowState === 'connection_failed'"
                  class="w-full h-full"
                >
                  <div class="flex flex-col items-center justify-center h-full w-full gap-5">
                    <vue-feather
                      type="x-circle"
                      class="icon w-[45px] h-min text-decline"
                    />
                    <p>
                      Connection Failed, Please try again.
                    </p>
                  </div>
                </section> -->
  
              <!-- SECTION: CONFIRMING SIGNAGE WITH AN EXISTING SECONDARY ACCOUNT -->
              <!-- <section
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
                      <vue-feather
                        type="arrow-left-circle"
                        class="icon w-[16px] h-min"
                      />
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
                </section> -->
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