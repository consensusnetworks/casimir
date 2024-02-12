<script setup>
import { ref, computed } from "vue"
import useUser from "@/composables/services/user"
import useConnectWalletModal from "@/composables/state/connectWalletModal"
import useFormat from "@/composables/services/format"
import useToasts from "@/composables/state/toasts"

const {
    addToast,
} = useToasts()

const { 
    convertString,
    formatEthersCasimir,
} = useFormat()
import { 
    DocumentDuplicateIcon,
    MinusIcon,
    ChevronDoubleLeftIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDoubleRightIcon
} from "@heroicons/vue/24/outline"

const convertStringLong = (str) => {
    if (str.length <= 6) {
        return str
    }
    
    const firstThreeChars = str.substring(0, 3)
    const lastThreeChars = str.substring(str.length - 3)
    const middleStars = "*".repeat(str.length - 18)

    return `${firstThreeChars}${middleStars}${lastThreeChars}`
}

const { toggleConnectWalletModal } = useConnectWalletModal()
const { user, removeAccount } = useUser()

const userSecondaryAccounts = computed(() =>{
    let secondaryAccounts = []
    user?.value?.accounts?.map((item) => {
        if (item.address != user.value.address) secondaryAccounts.push(item)
    })
    return secondaryAccounts
})

// primary || index number for secondary accounts
const currentSecondaryWallets = ref([0 , 3])
const showWalletBanner = ref(-1)
const pageSize = 4

const goToFirstPage = () => {
    currentSecondaryWallets.value = [0, 3] 
}

const goToPreviousPage = () => {
    const start = Math.max(0, currentSecondaryWallets.value[0] - pageSize)
    const end = Math.max(3, start + pageSize - 1)
    currentSecondaryWallets.value = [start, end]
}

const goToNextPage = () => {
    const start = Math.min(userSecondaryAccounts.value.length - 1, currentSecondaryWallets.value[0] + pageSize)
    const end = Math.min(userSecondaryAccounts.value.length - 1, start + pageSize - 1)
    currentSecondaryWallets.value = [start, end]
}

const goToLastPage = () => {
    const start = Math.max(0, userSecondaryAccounts.value.length - pageSize)
    const end = userSecondaryAccounts.value.length - 1
    currentSecondaryWallets.value = [start, end]
}

function copyTextToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            setTimeout(() => {
                addToast(
                    {
                        id: "copy_address_" + text,
                        type: "success",
                        title: "Address Copied",
                        subtitle: "Copied Address " + convertString(text),
                        timed: true,
                        loading: false
                    }
                )
            }, 1000)
        })
        .catch(err => {
            setTimeout(() => {
                addToast(
                    {
                        id: "copy_address_" + text,
                        type: "failed",
                        title: "Failed to Copy Address",
                        subtitle: "Something went wrong, please try again later",
                        timed: true,
                        loading: false
                    }
                )
            }, 1000)
        })
}
</script>

<template>
  <div class="card w-full h-full shadow py-[24px] flex flex-col gap-[24px] relative">
    <div class="flex items-start justify-between px-[24px] flex-wrap gap-[12px]">
      <div class="">
        <h1 class="card_title">
          Wallets Connected
        </h1>
        <p class="card_subtitle">
          Connect and manage the wallets you want under your account
        </p>
      </div>

      <div>
        <button
          class="secondary_btn w-[122px] 600s:sr-only"
          @click="toggleConnectWalletModal"
        >
          <caption class=" whitespace-nowrap font-[500] tracking-wide mt-[2px]">
            {{ user? '+ Add Wallet' : 'Connect Wallet' }}
          </caption>
        </button>
      </div>
    </div>

    <div v-if="user">
      <caption
        class="text-gray_1 dark:text-mainLightText/30 
        whitespace-nowrap font-[600] px-[24px] mb-[12px]"
      >
        Primary Wallet
      </caption>
      <div
        class="w-full relative py-[6px]"
        @mouseenter="showWalletBanner = 'primary'"
        @mouseleave="showWalletBanner = -1"
      >
        <div class="flex items-center justify-between gap-[8px] px-[36px]">
          <div class="flex items-center gap-[12px]">
            <div class="w-[36px] h-[36px] 400s:sr-only">
              <img
                :src="`/${user.walletProvider.toLowerCase()}.svg`"
                :alt="`/${user.walletProvider.toLowerCase()}.svg`"
                class="block w-full h-full max-w-full"
              >
            </div>

            <div class="card_title font-[400] mb-0 text-gray_5">
              <small class="font-[500]">
                {{ user.walletProvider }}
              </small><br>
              <caption class="whitespace-nowrap font-[400] not-sr-only 630s:sr-only">
                {{ convertStringLong(user.address) }}
              </caption>
              <caption class="whitespace-nowrap font-[400] sr-only 630s:not-sr-only">
                {{ convertString(user.address) }}
              </caption>
            </div>
          </div>

          <div>
            <h6 class="630s:text-[12px] whitespace-nowrap">
              {{ formatEthersCasimir(user.accounts[user.accounts.findIndex(item => item.address == user.address)].balance) }} ETH
            </h6>
          </div>
        </div>
        <div
          v-if="showWalletBanner == 'primary'"
          class="absolute top-0 left-0 w-full h-full gradient flex items-center justify-center gap-[12px]"
        >
          <button
            class="secondary_btn whitespace-nowrap"
            @click="copyTextToClipboard(user.address)"
          >
            <DocumentDuplicateIcon class="w-[14px] h-[14px]" />
            <caption class="font-[500]">
              Copy Address
            </caption>
          </button>
        </div>
      </div>

      <caption
        class="text-gray_1 dark:text-mainLightText/30 
        whitespace-nowrap font-[600] px-[24px] my-[12px]"
      >
        Secondary Wallet(s)
      </caption>

      <div
        v-if="user.accounts.length > 4"
        class="flex flex-col gap-[12px]"
      >
        <div
          v-for="(wallet, index) in userSecondaryAccounts.slice(currentSecondaryWallets[0], currentSecondaryWallets[1] + 1 )"
          :key="index"
          class="w-full relative py-[6px]"
          @mouseenter="showWalletBanner = wallet.id"
          @mouseleave="showWalletBanner = -1"
        >
          <div class="flex items-center justify-between gap-[8px] px-[36px]">
            <div class="flex items-center gap-[12px]">
              <div class="w-[36px] h-[36px] 400s:sr-only">
                <img
                  :src="`/${wallet.walletProvider.toLowerCase()}.svg`"
                  :alt="`/${wallet.walletProvider.toLowerCase()}.svg`"
                  class="block w-full h-full max-w-full"
                >
              </div>

              <div class="card_title font-[400] mb-0 text-gray_5">
                <small class="font-[500]">
                  {{ wallet.walletProvider }} {{ wallet.id }}
                </small><br>
                <caption class="whitespace-nowrap font-[400] not-sr-only 630s:sr-only">
                  {{ convertStringLong(wallet.address) }}
                </caption>
                <caption class="whitespace-nowrap font-[400] sr-only 630s:not-sr-only">
                  {{ convertString(wallet.address) }}
                </caption>
              </div>
            </div>

            <div>
              <h6 class="630s:text-[12px] whitespace-nowrap">
                {{ formatEthersCasimir(wallet.balance ) }} ETH
              </h6>
            </div>
          </div>
          <div
            v-if="showWalletBanner == wallet.id"
            class="absolute top-0 left-0 w-full h-full gradient flex items-center justify-center gap-[12px]"
          >
            <button
              class="warning_btn whitespace-nowrap"
              @click="removeAccount(wallet)"
            >
              <MinusIcon class="w-[14px] h-[14px]" />
              <caption class="font-[500]">
                Remove Wallet
              </caption>
            </button>
            <button
              class="secondary_btn whitespace-nowrap"
              @click="copyTextToClipboard(wallet.address)"
            >
              <DocumentDuplicateIcon class="w-[14px] h-[14px]" />
              <caption class="font-[500]">
                Copy Address
              </caption>
            </button>
          </div>
        </div>
      </div>

      <div
        v-else
        class="flex flex-col gap-[12px]"
      >
        <div
          v-for="(wallet, index) in userSecondaryAccounts"
          :key="index"
          class="w-full relative py-[6px]"
          @mouseenter="showWalletBanner = wallet.id"
          @mouseleave="showWalletBanner = -1"
        >
          <div class="flex items-center justify-between gap-[8px] px-[36px]">
            <div class="flex items-center gap-[12px]">
              <div class="w-[36px] h-[36px] 400s:sr-only">
                <img
                  :src="`/${wallet.walletProvider.toLowerCase()}.svg`"
                  :alt="`/${wallet.walletProvider.toLowerCase()}.svg`"
                  class="block w-full h-full max-w-full"
                >
              </div>

              <div class="card_title font-[400] mb-0 text-gray_5">
                <small class="font-[500]">
                  {{ wallet.walletProvider }} {{ wallet.id }}
                </small><br>
                <caption class="whitespace-nowrap font-[400] not-sr-only 630s:sr-only">
                  {{ convertStringLong(wallet.address) }}
                </caption>
                <caption class="whitespace-nowrap font-[400] sr-only 630s:not-sr-only">
                  {{ convertString(wallet.address) }}
                </caption>
              </div>
            </div>

            <div>
              <h6 class="630s:text-[12px] whitespace-nowrap">
                {{ formatEthersCasimir(wallet.balance ) }} ETH
              </h6>
            </div>
          </div>
          <div
            v-if="showWalletBanner == wallet.id"
            class="absolute top-0 left-0 w-full h-full gradient flex items-center justify-center gap-[12px]"
          >
            <button
              class="warning_btn whitespace-nowrap"
              @click="removeAccount(wallet)"
            >
              <MinusIcon class="w-[14px] h-[14px]" />
              <caption class="font-[500]">
                Remove Wallet
              </caption>
            </button>
            <button
              class="secondary_btn whitespace-nowrap"
              @click="copyTextToClipboard(wallet.address)"
            >
              <DocumentDuplicateIcon class="w-[14px] h-[14px]" />
              <caption class="font-[500]">
                Copy Address
              </caption>
            </button>
          </div>
        </div>
      </div>


      <div
        class="flex items-center justify-between 600s:justify-end gap-[15px] px-[36px] absolute bottom-0 w-full pb-[12px]"
      >
        <div class="text-[#71717a] text-[12px] font-[400] 630s:sr-only">
          Secondary Wallets ( {{ (currentSecondaryWallets[0] + 1 ) + ' to ' + (currentSecondaryWallets[1] + 1) }} ) of {{ userSecondaryAccounts?.length }}
        </div>
        <div class="flex items-center gap-[5px] text-[#71717a]">
          <button
            class="border border-[#e4e4e7] rounded-[6px] p-[4px] 
            hover:bg-[#F4F4F5] cursor-pointer"
            @click="goToFirstPage"
          >
            <ChevronDoubleLeftIcon class="h-[14px] w-[14px]" />
          </button>
          <button
            class="border border-[#e4e4e7] rounded-[6px] p-[4px] 
            hover:bg-[#F4F4F5] cursor-pointer"
            @click="goToPreviousPage"
          >
            <ChevronLeftIcon class="h-[14px] w-[14px]" />
          </button>
          <button
            class="border border-[#e4e4e7] rounded-[6px] p-[4px] 
            hover:bg-[#F4F4F5] cursor-pointer"
            @click="goToNextPage"
          >
            <ChevronRightIcon class="h-[14px] w-[14px]" />
          </button>
          <button
            class="border border-[#e4e4e7] rounded-[6px] p-[4px] 
            hover:bg-[#F4F4F5] cursor-pointer"
            @click="goToLastPage"
          >
            <ChevronDoubleRightIcon class="h-[14px] w-[14px]" />
          </button>
        </div>
      </div>
    </div>

    <div
      v-else
      class="h-full flex items-center justify-center"
    >
      <p class="text-mainDarkText/30 dark:text-mainLightText/30">
        No Wallets Connected
      </p>
    </div>
  </div>
</template>

<style>
.gradient {
    background-image: linear-gradient(to right, rgba(113, 113, 122, 0.45) 0%,rgba(113, 113, 122, 0.75) 25%, rgba(113, 113, 122, 1) 50%,rgba(113, 113, 122, .75) 75%, rgba(113, 113, 122, 0.45) 100%);
}
</style>