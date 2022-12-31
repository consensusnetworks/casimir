
<script lang="ts" setup>
import { ref } from 'vue'

 const wallets = ref([])
</script>
  
<template>
  <div class="">
    <h6 class="text-grey_5 font-medium">
      Connect your wallets to view and access all of your assets in one location
    </h6>
    <div class="pb-20 mt-25 grid grid-cols-3">
      <div 
        :class="wallets.length > 0? 'col-span-1':'col-span-2'"
        class="border-r border-r-grey_2 flex flex-col gap-15"
      >
        <button class="supported_wallet_box">
          <img
            src="/metamask.svg"
            alt=""
          >
          <h6>
            Metamask
          </h6>
        </button>
        <button class="supported_wallet_box">
          <div class="flex items-center gap-15">
            <img
              src="/walletconnect.svg"
              alt=""
            > 
            <span 
              class="text-body font-bold text-grey_3 sr-only s_xsm:not-sr-only"
            >
              Ethereum only
            </span>
          </div>
          <h6>
            Wallet Connect
          </h6>
        </button>
        <button class="supported_wallet_box">
          <img
            src="/coinbase.svg"
            alt=""
          >
          <h6>
            Coinbase
          </h6>
        </button>
        <button class="supported_wallet_box">
          <img
            src="/ledger.svg"
            alt=""
          >
          <h6>
            Ledger
          </h6>
        </button>
        <button class="supported_wallet_box">
          <img
            src="/phantom.svg"
            alt=""
          >
          <h6>
            Phantom
          </h6>
        </button>
        <button class="supported_wallet_box">
          <img
            src="/keplr.svg"
            alt=""
          >
          <h6>
            Keplr
          </h6>
        </button>
        <button class="supported_wallet_box">
          <img
            src="/trezor.svg"
            alt=""
          >
          <h6>
            Trezor
          </h6>
        </button>
      </div>
      <div
        v-if="wallets.length === 0"
        :class="wallets.length > 0? 'col-span-2':'col-span-1'"
        class="border-l border-l-grey_2 h-full flex justify-center items-center"
      >
        <h6 class="text-grey_2 font-medium">
          No Wallets Connected
        </h6>
      </div>
      <div
        v-else
        :class="wallets.length > 0? 'col-span-2':'col-span-1'"
        class="border-l border-l-grey_2 h-full flex justify-center items-center"
      >
        <!-- list of wallets connected here -->
        wallets
      </div>
    </div>
  </div>
</template>