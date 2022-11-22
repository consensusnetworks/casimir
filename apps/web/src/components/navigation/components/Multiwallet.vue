<script lang="ts" setup>
import { ref } from 'vue'


// eslint-disable-next-line no-undef
const props = defineProps({
    open: {
        type: Boolean,
        required: true
    }
})

// To Do: connect this to our Auth and see if an account exsists
const account = ref(false)

// To Do: get list of connected wallets
const connectedWallets = ref([
    {
        name: 'Metamask',
        icon: 'metamask.svg',
        master: true,
    },
    {
        name: 'Coinbase',
        icon: 'coinbase.svg',
        master: false,
    },
    {
        name: 'Wallet Connect',
        icon: 'walletconnect.svg',
        master: false,
    },
    {
        name: 'Ledger',
        icon: 'ledger.svg',
        master: false,
    },
])

</script>
  
<template>
  <div class="px-gutter">
    <div
      v-if="open"
      class="text-white flex align-center slowExpandText mb-gutter uppercase ml-[5px]"
    >
      <h6> Casimir </h6>
      <h6> Multiwallet </h6>
    </div>
    <div
      v-else
      class="text-white flex align-center slowExpandText mb-[30px] uppercase ml-[5px]"
    >
      <i class="iconoir-wallet text-[24px]" />
    </div>
    <div v-if="account">
      <div
        class="flex mb-gutter overflow-hidden py-[12px] pl-[5px]"
      >
        <!-- List of connected Wallet -->
        <div :class="!account? 'flex flex-col text-grey_5': 'flex flex-col text-white cursor-default'">
          <div
            v-for="item in connectedWallets"
            :key="item.name"
            class="flex mb-[10px]"
          >
            <div class="flex">
              <!-- To Do: Make this icon dragable and once it's placed in a wallet, that wallet becomes master wallet -->
              <i
                v-show="item.master && open"
                class="iconoir-keyframe-align-center text-blue_4 text-[24px] mr-[10px]"
              />
              <img
                class="w-[24px]"
                :src="item.icon"
                :alt="item.name + ' Icon'"
              >
            </div>
            
            <h6
              v-show="open"
              class="slowExpandText h-min text-clip ml-gutter mt-[3px] text-body"
            >
              {{ item.name }}
            </h6>
          </div>
          <span
            v-show="open"
            class="text-body text-grey_5"
          >
            Drag the <i class="iconoir-keyframe-align-center text-blue_4 text-[12px] mx-[5px] inline-block" />
            icon to change your master wallet (Master wallet is the wallet that you connect
            to view your assets across all wallets)
          </span>
        </div>
      </div>
    </div>
    <div
      v-else
    >
      <div
        v-if="open"
        class="px-[5px] w-[px] overflow-hidden "
      >
        <li class=" list-none text-body text-grey_5 font-semibold mb-[10px]">
          Get Started with Casimir's Multiwallet Connect
        </li>
        <ul class="list-disc pl-[15px] text-body text-grey_5 font-medium">
          <li class="my-[5px]">
            Connect multiple wallets
          </li>
          <li class="my-[5px]">
            View and manage your assets across all types of wallets
          </li>
          <li class="my-[5px]">
            Stake t our supported protocoals with any of your connected wallets
          </li>
        </ul>
      </div>
    </div>
    <button
      v-show="open"
      class="btn_primary my-[15px] text-body w-full"
    >
      Launch Casimir Multiwallet
    </button>

    <!-- This button will be romoved once we get a way to get dynamic accouts in -->
    <div class="text-center absolute border bg-blue_5 bottom-0">
      <button
        class="btn_primary text-body"
        @click="account = !account"
      >
        <i class="iconoir-mouse-button-left text-white" />
      </button>
    </div>

    <!-- To Do: Add settings button with settings page below -->
  </div>
</template>