<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import {
    TransitionRoot,
    TransitionChild,
    Dialog,
    DialogPanel,
} from "@headlessui/vue"
import {
    ArrowLeftCircleIcon,
    ExclamationCircleIcon
} from "@heroicons/vue/24/outline"
import useConnectWalletModal from "@/composables/state/connectWalletModal"
import Loading from "@/components/elements/Loading.vue"
import Success from "@/components/elements/Success.vue"
import Failure from "@/components/elements/Failure.vue"
import useAuth from "@/composables/services/auth"
import useEthers from "@/composables/services/ethers"
import useEnvironment from "@/composables/services/environment"
import useFormat from "@/composables/services/format"
import useUser from "@/composables/services/user"
import useWallets from "@/composables/services/wallets"
import useWalletConnectV2 from "@/composables/services/walletConnectV2"
import { CryptoAddress, LoginCredentials, ProviderString } from "@casimir/types"

const { login, loginWithSecondaryAddress } = useAuth()
const { openConnectWalletModal, toggleConnectWalletModal } = useConnectWalletModal()
const { getEthersAddressesWithBalances, browserProvidersList } = useEthers()
const { requiredNetwork } = useEnvironment()
const { convertString, formatEthersCasimir, trimAndLowercaseAddress } = useFormat()
const { user } = useUser()
const { detectActiveNetwork, switchEthersNetwork } = useWallets()
const { connectWalletConnectV2 } = useWalletConnectV2()

type UserAuthFlowState = 
  "select_provider"
  | "select_address" 
  | "loading" 
  | "success" 
  | "add_account" 
  | "confirm_signage_with_existing_secondary" 
  | "connection_failed"

const flowState = ref<UserAuthFlowState>("select_provider")

const errorMessage = ref(false)
const errorMessageText = ref("Something went wrong, please try again later.")
const selectProviderLoading = ref(false)
const selectedAddress = ref(null as string | null)
const selectedProvider = ref<ProviderString>("")
const walletProviderAddresses = ref([] as CryptoAddress[])

const supportedWalletProviders: Array<ProviderString> = [
    "MetaMask",
    "CoinbaseWallet",
    "WalletConnect",
    "Trezor",
    "Ledger",
    "TrustWallet",
    // 'IoPay',
]

function checkIfAddressIsUsed(account: CryptoAddress): boolean {
    const { address } = account
    if (user.value?.accounts) {
        const accountAddresses = user.value.accounts.map((account: any) => account.address)
        if (accountAddresses.includes(address)) return true
    }
    return false
}

async function selectAddress(address: string, pathIndex?: number): Promise<void> {
    selectedAddress.value = address
    flowState.value = "loading"
    const loginCredentials: LoginCredentials = 
      pathIndex !== undefined ? 
          { provider: selectedProvider.value as ProviderString, address, currency: "ETH", pathIndex } : 
          { provider: selectedProvider.value as ProviderString, address, currency: "ETH" }
    const response = await login(loginCredentials)
    if (response === "Successfully logged in" || response === "Successfully added account to user") {
        flowState.value = "success"
        setTimeout(() => {
            closeModal()
            setTimeout(() => {
                flowState.value = "select_provider"
            }, 100)
        }, 1000)
    } else if (response === "Address already exists on this account") {
        flowState.value = "select_address"
        errorMessage.value = true
        errorMessageText.value = "Address selected is already connected to your account."
    } else if (
        response === "Address already exists as a primary address on another account" ||
        response === "Address already exists as a secondary address on another account"
    ) {
        flowState.value = "confirm_signage_with_existing_secondary"
    } else if (response === "Selected address is not active address in wallet") {
        flowState.value = "select_address"
        errorMessage.value = true
        errorMessageText.value = "Address selected is not active."
    } else if (response === "Error in userAuthState") {
        flowState.value = "connection_failed"
        setTimeout(() => {
            closeModal()
            setTimeout(() => {
                flowState.value = "select_provider"
            }, 100)
        }, 1000)
    } else {
        errorMessage.value = true
        errorMessageText.value = "Something went wrong, please try again later."
    }
}

async function selectProvider(provider: ProviderString): Promise<void> {
    console.clear()
    try {
        selectedProvider.value = provider
        selectProviderLoading.value = true
    
        // Hard Goerli Check
        // TODO: Re-enable and make this dynamic
        // if (provider !== "WalletConnect") {
        //     const activeNetwork = await detectActiveNetwork(selectedProvider.value as ProviderString)
        //     if (activeNetwork !== 5) {
        //         await switchEthersNetwork(selectedProvider.value, "0x5")
        //         return window.location.reload()
        //     }
        // }

        if (provider === "WalletConnect") {
            // TODO: @@cali1 - pass in the network id dynamically
            walletProviderAddresses.value = await connectWalletConnectV2(requiredNetwork) as CryptoAddress[]
        } else if (browserProvidersList.includes(provider)) {
            walletProviderAddresses.value = await getEthersAddressesWithBalances(provider) as CryptoAddress[]
        } else if (provider === "Ledger") {
            // walletProviderAddresses.value = await getEthersLedgerAddresses() as CryptoAddress[]
        } else if (provider === "Trezor") {
            // walletProviderAddresses.value = await getEthersTrezorAddresses() as CryptoAddress[]
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

async function handleConfirmCreateAccountWithExistingSecondary() {
    flowState.value = "loading"
    const loginCredentials: LoginCredentials = { provider: selectedProvider.value as ProviderString, address: selectedAddress.value as string, currency: "ETH", pathIndex: 0 }
    const response = await loginWithSecondaryAddress(loginCredentials)
    if (response === "Successfully created account and logged in") {
        flowState.value = "success"
        setTimeout(() => {
            closeModal()
            setTimeout(() => {
                flowState.value = "select_provider"
            }, 100)
        }, 1000)
    } else if (response === "Selected address is not active address in wallet") {
        flowState.value = "select_address"
        errorMessage.value = true
        errorMessageText.value = "Address selected is not active."
    } else if (response === "Error in userAuthState") {
        flowState.value = "connection_failed"
        setTimeout(() => {
            closeModal()
            setTimeout(() => {
                flowState.value = "select_provider"
            }, 100)
        }, 1000)
    } else {
        errorMessage.value = true
        errorMessageText.value = "Something went wrong, please try again later."
    }
}

function closeModal() {
    toggleConnectWalletModal(false)
}

function handleOuterClick(event: any) {
    const modal_container = document.getElementById("connect_wallet_modal")
    if (
        modal_container && 
        !modal_container.contains(event.target)
    ) {
        closeModal()
        setTimeout(() => {
            if (user.value) {
                flowState.value = "add_account"
            } else {
                flowState.value = "select_provider"
            }
        }, 200)
    }
}

onMounted(() => {
    if (user.value) {
        flowState.value = "add_account"
    } else {
        flowState.value = "select_provider"
    }
})

onUnmounted(() => {
    if (user.value) {
        flowState.value = "add_account"
    } else {
        flowState.value = "select_provider"
    }
})
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
                  <h1 class="card_title font-[500] tracking-tight">
                    {{ flowState === 'select_provider'? 'Connect Wallet' : 'Add Wallet' }}
                  </h1>
                  <p class="card_subtitle">
                    Select a wallet provider
                  </p>
                </div>
  
                <div class="mt-[20px] flex flex-col gap-[12px]">
                  <div
                    v-for="walletProvider in supportedWalletProviders"
                    :key="walletProvider"
                  >
                    <button
                      class="flex items-center justify-between gap-5 w-full border relative px-[12px] py-[8px] shadow
                        rounded-[6px] bg-lightBg dark:bg-darkBg border-lightBorder dark:border-lightBorder/40
                        hover:bg-hover_white/30 dark:hover:bg-hover_black/30 active:bg-hover_white/60 dark:active:bg-hover_black/60"
                      :disabled="selectProviderLoading"
                      @click="selectProvider(walletProvider)"
                    >
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
                          <div class="tooltip w-[260px]">
                          You currently do not have the extension for this wallet provider connected, click the button
                          to take you to the wallet provider extension page.
                          </div>
                      </div> -->
                  </div>
                </div>
                <div class="h-15 w-full text-[11px] font-[500] mb-5 text-red">
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
                  <div class="flex items-start gap-[12px]">
                    <button
                      v-show="walletProviderAddresses.length > 0"
                      @click="flowState = 'select_provider'"
                    >
                      <ArrowLeftCircleIcon class="w-[16px] h-[16px]" />
                    </button>
                    <h1 class="card_title font-[500] tracking-tight">
                      Select Wallet
                    </h1>
                  </div>
                  <p class="card_subtitle">
                    Select the wallet address you want to connect with
                  </p>
                </div>
  
                <div
                  v-if="walletProviderAddresses.length === 0"
                  class="mt-[30px] h-[310px] flex flex-col justify-between"
                >
                  <div class="card_title font-[500] tracking-tight font-[400] text-red mb-[20px]">
                    We do not see any available addresses, please connect or create a wallet to the selected provider
                  </div>
                  <button
                    class="primary_btn w-full flex items-center justify-center text-sm"
                    @click="flowState = 'select_provider'"
                  >
                    <ArrowLeftCircleIcon class="w-[16px] h-[16px]" /> back
                  </button>
                </div>
  
                <div class="h-[260px] overflow-y-auto flex flex-col gap-[12px] mt-[20px]">
                  <div
                    v-for="(act, pathIndex) in walletProviderAddresses"
                    :key="pathIndex"
                    class="flex items-center gap-[12px]"
                  >
                    <div
                      v-if="checkIfAddressIsUsed(act)"
                      class="tooltip_container"
                    >
                      <ExclamationCircleIcon class="w-[24px] h-[24px] text-orange-400" />
                      <div class="tooltip w-[200px]">
                        This wallet is currently connect with this account
                      </div>
                    </div>
                    <button
                      class="flex items-center justify-between gap-5 w-full border relative px-[12px] py-[8px] shadow
                        rounded-[6px] bg-lightBg dark:bg-darkBg border-lightBorder dark:border-lightBorder/40
                        hover:bg-hover_white/30 dark:hover:bg-hover_black/30 active:bg-hover_white/60 dark:active:bg-hover_black/60"
                      :disabled="checkIfAddressIsUsed(act)"
                      :class="checkIfAddressIsUsed(act)? 'opacity-30' : ''"
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
                        {{ (Number(parseFloat(act.balance)).toFixed(2)) }} ETH
                      </div>
                    </button>
                  </div>
                </div>
  
                <div class="h-15 w-full font-[500] mb-[5px] text-red h-[20px]">
                  <small v-show="errorMessage">
                    {{ errorMessageText }} 
                  </small>
                </div>
                <div class="w-full">
                  <small
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
                      class="w-full card_title font-[500] tracking-tight"
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
                      class="w-full card_title font-[500] tracking-tight"
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
                      class="w-full card_title font-[500] tracking-tight"
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
                  <h1 class="card_title font-[500] tracking-tight">
                    Confirm selection
                  </h1>
                  <p class="card_subtitle">
                    The current wallet you are trying to connect exists under another primary wallet or is a primary account.
                  </p>
                  <p class="card_subtitle mt-[12px]">
                    Connecting this address will create a new account, you can still access your previous account by
                    connecting with said account primary address
                  </p>
                  <p class="card_subtitle mt-[30px] font-[500]">
                    Would you like to create a new account with this address as the primary wallet address?
                  </p>
                </div>
  
                <div class="mt-15 mb-[5px] h-[165px] w-full flex flex-col items-center justify-end gap-[12px]">
                  <button
                    class="secondary_btn flex items-center w-full justify-center text-sm"
                    @click="flowState = 'select_address'"
                  >
                    <ArrowLeftCircleIcon class="w-[16px] h-[16px]" /> Back
                  </button>
                  <button
                    class="primary_btn w-full flex items-center justify-center text-sm"
                    @click="handleConfirmCreateAccountWithExistingSecondary"
                  >
                    Create Account
                  </button>
                </div>
                <div class="h-15 w-full h-[20px] text-[11px] font-[500] mb-5 text-decline">
                  <span v-show="errorMessage">
                    Something went wrong, please try again later.
                  </span>
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