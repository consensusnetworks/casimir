<script setup>
import useConnectWalletModal from "@/composables/state/connectWalletModal"

const { toggleConnectWalletModal } = useConnectWalletModal()
// import { ref } from "vue"
// const supportedWalletProviders = [
//     "MetaMask",
//     "CoinbaseWallet",
//     "WalletConnect",
//     "Trezor",
//     "Ledger",
//     "TrustWallet",
//     // 'IoPay',
// ]

// const showName = ref(null)
</script>

<template>
  <div
    class="page_container flex items-center justify-center"
  >
    <div class="flex flex-col items-center justify-center z-[2]">
      <div class="welcome_page_header text-black dark:text-white">
        The best staking experience 
      </div>
      <div class="welcome_page_header mb-[12px] text-black dark:text-white">
        made specifically with you in mind
      </div>

      <div class="welcome_page_subheader mb-[20px] text-black dark:text-white">
        Start staking and viewing your assets across our supported chains
      </div>
      <div class="mb-[30px]">
        <button
          class="primary_btn"
          @click="toggleConnectWalletModal(true)"
        >
          <small class="mt-[1px]">Connect Wallet</small>
        </button>
      </div>

      

      <!-- <div class="flex items-center gap-[12px]">
        <div
          v-for="i in supportedWalletProviders"
          :key="i"
          class="border px-[12px] py-[6px] rounded-[6px] flex items-center justify-between gap-[24px] overflow-hidden"
          :class="i != showName? 'w-[46px]' : 'w-[200px]'"
          style="
          transition: all 0.5s ease-in;
          "
          @mouseover="showName = i"
          @mouseleave="showName = null"
        >
          <img
            :src="`/${i.toLowerCase()}.svg`"
            :alt="`${i.toLowerCase()} image`"
            class="w-[20px] h-[20px]"
          >

          <h6 v-show="i === showName">
            {{ i }}
          </h6>
        </div>
      </div> -->
    </div>
  </div>
</template>

<style scoped>
.welcome_page_header{
  text-align: center;
  font-family: Inter;
  font-size: 18px;
  font-style: normal;
  font-weight: 500;
  line-height: normal;
  letter-spacing: -0.72px;
}
.welcome_page_subheader{
  text-align: center;
  font-family: Inter;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 148.858%; 
}
</style>
