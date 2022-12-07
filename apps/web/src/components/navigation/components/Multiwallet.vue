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
const account = ref(true)

// To Do: get list of connected wallets
const connectedWallets = ref([
    {
        name: 'Metamask',
        icon: '/metamask.svg',
        master: true,
    },
    {
        name: 'Coinbase',
        icon: '/coinbase.svg',
        master: false,
    },
    {
        name: 'Wallet Connect',
        icon: '/walletconnect.svg',
        master: false,
    },
    {
        name: 'Ledger',
        icon: '/ledger.svg',
        master: false,
    },
])

</script>
  
<template>
  <div class="px-gutter">
    <div
      v-if="open"
      class="text-white flex flex-col slowExpandText mb-gutter uppercase ml-[5px]"
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
        v-show="open"
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
              <!-- <i
                v-show="item.master && open"
                class="iconoir-keyframe-align-center text-blue_4 text-[24px] mr-[10px]"
              /> -->
              <img
                class="w-[20px]"
                :src="item.icon"
                :alt="item.name + ' Icon'"
              >
            </div>
            
            <h6
              class="slowExpandText h-min text-clip ml-gutter mt-[3px] text-body font-medium whitespace-nowrap"
            >
              {{ item.name }}
            </h6>
          </div>
          <!-- Will add this back when draggable icon is implemented -->
          <!-- <span
            v-show="open"
            class="text-body text-grey_5 w-[205px]"
          >
            Drag the <i class="iconoir-keyframe-align-center text-blue_4 text-[12px] mx-[5px] inline-block" />
            icon to change your master wallet (Master wallet is the wallet that you connect
            to view your assets across all wallets)
          </span> -->
        </div>
      </div>
    </div>
    <div
      v-else
    >
      <div
        v-if="open"
        class="px-[5px] w-[210px]"
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
            Stake to our supported protocoals with any of your connected wallets
          </li>
        </ul>
      </div>
    </div>
    <!-- Add this back after demo -->
    <!-- <button
      v-show="open"
      v-if="!account"
      class="btn_primary my-[15px] text-body w-full"
      @click="account = !account"
    >
      Launch Demo 
      <i
        class="iconoir-play-outline font-bold text-body"
      />
    </button>

    <button
      v-show="open"
      v-else
      class="btn_primary my-[15px] text-body w-full"
      @click="account = !account"
    >
      Close Demo 
      <i
        class="iconoir-cancel font-bold text-body"
      />
    </button> -->

    <!-- To Do: Add settings button with settings page below -->
  </div>
</template>