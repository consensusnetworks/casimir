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
        <div :class="!account? 'flex text-grey_5': 'flex text-white cursor-default'">
          <i
            class="iconoir-wallet text-[24px]"
          />
          <h6
            v-show="open"
            class="slowExpandText ml-gutter mt-[3px]"
          >
            WalletName
          </h6>
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
        <button
          class="btn_primary my-[15px] text-body w-full"
        >
          Launch Casimir Multiwallet
        </button>
      </div>
    </div>
    <div class="text-center absolute border bg-blue_5 bottom-0">
      <button
        class="btn_primary text-body"
        @click="account = !account"
      >
        <i class="iconoir-mouse-button-left text-white" />
      </button>
    </div>
  </div>
</template>