<script setup>
import { ref, watch, computed } from "vue"
import useStakingState from "@/composables/state/staking"
import useUser from "@/composables/services/user"
import useFormat from "@/composables/services/format"
import { 
    useDark,
} from "@vueuse/core"
import { Switch } from "@headlessui/vue"
import { 
    CheckIcon
} from "@heroicons/vue/24/outline"

const { user } = useUser()
const { convertString, formatEthersCasimir, formatDecimalString } = useFormat()

const userSecondaryAccounts = computed(() =>{
    let secondaryAccounts = []
    user?.value?.accounts?.map((item) => {
        if (item.address != user.value.address) secondaryAccounts.push(item)
    })
    return secondaryAccounts
})

const isDark = useDark()

const {
    stakingWalletAddress,
    eigenLayerSelection,
    toggleEigenlayerSelection,
    selectWallet,
    setAmountToStake,
    acceptTerms,
    toggleTerms,
    handleStake
} = useStakingState()

const openSelectWalletinput = ref(false)
const formatedAmountToStake = ref(null)
const errorMessage = ref(null)
const showErrorBorder = ref(false)

const handleClickOutside = (event) => {
    const inputSelector = document.getElementById("input_selector")
    const selector_button = document.getElementById("input_selector_button")
    if (
        openSelectWalletinput.value &&
        inputSelector &&
        !inputSelector.contains(event.target) &&
        selector_button &&
        !selector_button.contains(event.target)
    ) {
        openSelectWalletinput.value = false
    }
}

watch(openSelectWalletinput, (newValue) => {
    if (newValue) {
        document.addEventListener("click", handleClickOutside)
    } else {
        document.removeEventListener("click", handleClickOutside)
    }
})

const handleInputAmountToStake = (event) => {
    let value = event.target.value

    value = value.replace(/[^\d,.]/g, "")

    value = value.replace(/,{2,}/g, ",")

    value = value.replace(/\.{2,}/g, ".")

    const numericValue = parseFloat(value.replace(/,/g, ""))
    setAmountToStake(isNaN(numericValue) ? 0 : numericValue)
    formatedAmountToStake.value = formatInput(value)
}

const formatInput = (value) => {
    const parts = value.split(".")
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    return parts.join(".")
}

const clearErrorMessage = () => {
    setTimeout(() => {
        errorMessage.value = null
        showErrorBorder.value = false
    }, 3500)
}

const handleStakingAction = () => {
    handleStake()
    if (!stakingWalletAddress.value || !formatedAmountToStake.value) {
        errorMessage.value = "Please fill out all of the inputs before staking"
        showErrorBorder.value = true
        clearErrorMessage()
        return
    } 
    // else if() {
    // TODO: check balance of the the amount selected with the wallet selected
    // return
    // }
    if (!acceptTerms.value) {
        errorMessage.value = "Please accept the terms and conditions before staking"
        clearErrorMessage()
        return
    }

    setAmountToStake(null)
    selectWallet(null)
    formatedAmountToStake.value = null
}



</script>

<template>
  <div class="card w-full h-full shadow p-[24px] flex flex-col items-start justify-between gap-[24px] relative">
    <div class="">
      <h1 class="card_title">
        Quick Stake
      </h1>
      <p class="card_subtitle">
        Stake with any wallet and any amount
      </p>
    </div>

    <div class="w-full">
      <label for="wallet_selection"><caption class="font-[500]">Wallet</caption></label>
      <div
        ref="wallet_selection"
        class="input_container "
        :class="showErrorBorder && !stakingWalletAddress? 'border border-red' : 'input_container_border'"
      > 
        <button 
          id="input_selector_button"
          class="flex items-center justify-between gap-[8px] w-full h-full"
          :class="stakingWalletAddress ? 'text-black' : 'text-grey_4'"
          @click="openSelectWalletinput = !openSelectWalletinput"
        >
          <div
            v-if="stakingWalletAddress"
            class="tooltip_container"
          >
            {{ convertString(stakingWalletAddress) }} 
            ({{ formatEthersCasimir(formatDecimalString(user?.accounts[user?.accounts.findIndex(item => item.address == stakingWalletAddress)].balance)) }}) ETH
            <div class="tooltip whitespace-nowrap">
              <small>{{ user?.accounts[user?.accounts.findIndex(item => item.address == stakingWalletAddress)].balance }}</small>
            </div>
          </div>
          <small v-else>Select wallet</small>
          <img
            :src="isDark? '/expand_icon_light.svg':'/expand_icon_dark.svg'"
            alt="Expand Icon"
            class="w-[6.25px] h-[10.13px]"
          >
        </button>
        <div 
          v-show="openSelectWalletinput"
          id="input_selector"
          class="input_selector"
        >
          <div class="p-[8px] ">
            <caption
              v-if="user"
              class="text-gray_1 whitespace-nowrap font-[600]"
            >
              Primary Wallet
            </caption>

            <button
              v-if="user"
              class="w-full mt-[8px] rounded-[3px] flex items-center
                justify-between px-[8px] py-[6px] hover:bg-gray_4 dark:hover:bg-gray_5"
              @click="selectWallet(user.address), openSelectWalletinput = false"
            >
              <div class="flex items-center gap-[8px]">
                <div class="w-[20px] h-[20px]">
                  <img
                    :src="`/${user?.walletProvider.toLowerCase()}.svg`"
                    :alt="`/${user?.walletProvider.toLowerCase()}.svg`"
                    class="block w-full h-full max-w-full"
                  >
                </div>

                <div class="card_title font-[400] mb-0 text-gray_5">
                  {{ user?.address? convertString(user?.address) : '___' }}
                </div>
              </div>

              <div class="tooltip_container_left">
                {{ formatEthersCasimir(formatDecimalString(user?.accounts[user.accounts.findIndex(item => item.address == user.address)]?.balance)) }} ETH
                <div class="tooltip_left w-[100px] truncate whitespace-nowrap">
                  {{ user?.accounts[user.accounts.findIndex(item => item.address == user.address)]?.balance }}
                </div>
              </div>
            </button>

            <div
              v-else
              class="mt-[12px] flex justify-center"
            >
              <small class="text-red">No Wallets Connected</small>
            </div>
          </div>
          <div
            v-if="user?.accounts?.length > 1"
            class="p-[8px]"
          >
            <caption class="text-gray_1 whitespace-nowrap font-[600]">
              Secondary Wallet(s)
            </caption>
            <button
              v-for="(account, index) in userSecondaryAccounts"
              :key="index"
              class="w-full mt-[8px] rounded-[3px] flex items-center
                      justify-between px-[8px] py-[6px] hover:bg-gray_4 dark:hover:bg-gray_5 overflow-hidden"
              @click="selectWallet(account.address), openSelectWalletinput = false"
            >
              <div class="flex items-center gap-[8px]">
                <div class="w-[20px] h-[20px]">
                  <img
                    :src="`/${account.walletProvider.toLowerCase()}.svg`"
                    :alt="`/${account.walletProvider.toLowerCase()}.svg`"
                    class="block w-full h-full max-w-full"
                  >
                </div>

                <div class="card_title font-[400] mb-0">
                  {{ convertString(account.address) }}
                </div>
              </div>
              <div class="tooltip_container_left">
                {{ formatEthersCasimir(formatDecimalString(account.balance)) }} ETH
                <div class="tooltip_left w-[100px] truncate whitespace-nowrap">
                  {{ account.balance }}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full">
      <label for="amount_selector"><caption class="font-[500]">Amount</caption></label>
      <div
        ref="amount_selector"
        class="input_container"
        :class="showErrorBorder && !formatedAmountToStake? 'border border-red' : 'input_container_border'"
      > 
        <div class="flex items-center gap-[8px] w-full">
          <input
            id="amount_input"
            v-model="formatedAmountToStake"
            type="text"
            pattern="\d+(\.\d{1,18})?"
            placeholder="0.00"
            class="outline-none bg-transparent w-full"
            @input="handleInputAmountToStake"
          >
        </div>
        <div class="flex items-center gap-[4px]">
          <small class="font-[500]">
            ETH
          </small>
        </div>
      </div>
    </div>
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center gap-[8px]">
        <img
          class="w-[16px] h-[16px]"
          :src="isDark? '/eigen.svg' : '/eigen_black.svg'"
          alt="EigenLayer Logo"
        >
        <caption class="font-[500] tracking-normal">
          EigenLayer Restaking
        </caption>
      </div>
      <div>
        <Switch
          :class="eigenLayerSelection ? 'bg-black dark:bg-white' : ' bg-gray_1 dark:bg-gray_6'"
          class="switch_container"
          @click="toggleEigenlayerSelection"
        >
          <span class="sr-only">EigenLayer Enabled</span>
          <span
            aria-hidden="true"
            :class="eigenLayerSelection ? 'translate-x-4' : 'translate-x-0'"
            class="switch_ball"
          />
        </Switch>
      </div>
    </div>

    <div class="flex items-center justify-between w-full">
      <small class="font-[500]">Fees</small>
      <!-- TODO: Add fees here -->
      <small class="font-[500]">{{ 0.00 }}%</small>
    </div>

    <div
      class="h-[24px] w-full"
    >
      <div 
        :class="errorMessage? 'opacity-100' : 'opacity-0'"
        style="transition: all 0.6s ease-in;"
      >
        <small class="text-red font-[500]">{{ errorMessage }}</small>
      </div>
    </div>

    <div class="w-full">
      <div class="flex items-center gap-[12px]">
        <button
          class="checkbox_button bg-transparent"
          @click="toggleTerms"
        >
          <CheckIcon
            v-show="acceptTerms"
            class="h-[14px] w-[14px]"
          />
        </button>
        <small>Accept terms and conditions</small>
      </div>
      <button
        class="primary_btn w-full mt-[8px]"
        @click="handleStakingAction"
      >
        <small class="font-[500]">Stake</small>
      </button>
    </div>
  </div>
</template>

<style>
</style>