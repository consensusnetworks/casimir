<script lang="ts" setup>
import { ref } from 'vue'
import useUsers from '@/composables/users'

// eslint-disable-next-line no-undef
const props = defineProps({
    open: {
        type: Boolean,
        required: true
    }
})

const { user } = useUsers()
console.log(user.value)

// To Do: get list of connected wallets
// const connectedWallets = ref(user.value.accounts)

</script>
  
<template>
  <div class="px-gutter">
    <div
      v-if="open"
      class="text-white flex flex-col slowExpandText mb-gutter ml-[5px]"
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
    <div v-if="user">
      <div
        v-show="open"
        class="flex mb-gutter overflow-hidden py-[12px] pl-[5px]"
      >
        <!-- List of connected Wallet -->
        <div :class="!user? 'flex flex-col text-grey_5': 'flex flex-col text-white cursor-default'">
          <span
            class="slowExpandText text-clip text-body mb-[10px] font-medium whitespace-nowrap"
          >
            Connected Wallets
          </span>
          <div
            v-if="user.accounts.MetaMask"
            class="flex mb-[10px]"
          >
            <img
              class="w-[20px]"
              src="/metamask.svg"
              alt="Metamask Icon"
            >
            <h6
              class="slowExpandText h-min text-clip ml-gutter mt-[3px] text-body font-medium whitespace-nowrap"
            >
              Metamask
            </h6>
          </div>
          <!-- <div
            v-for="item in connectedWallets"
            :key="item.name"
            class="flex mb-[10px]"
          >
            <div class="flex"> -->
          <!-- To Do: Make this icon dragable and once it's placed in a wallet, that wallet becomes master wallet -->
          <!-- <i
                v-show="item.master && open"
                class="iconoir-keyframe-align-center text-blue_4 text-[24px] mr-[10px]"
              /> -->
          <!-- <img
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
          </div> -->
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