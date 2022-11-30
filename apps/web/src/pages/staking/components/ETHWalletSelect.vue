<script lang="ts" setup>
import { ref } from 'vue'



const connectedWallets = ref([
    {
        name: 'Metamask',
        icon: '/metamask.svg',
    },
    {
        name: 'Coinbase',
        icon: '/coinbase.svg',
    },
    {
        name: 'Wallet Connect',
        icon: '/walletconnect.svg',
    },
    {
        name: 'Ledger',
        icon: '/ledger.svg',
    },
])
</script>
  
<template>
  <div class="w-full flex flex-col gap-[20px] min-h-[80%] max-h-[90%]">
    <h6 class="text-grey_5 font-medium">
      Select wallet and amount to stake
      <hr class="bg-grey_2 h-[2px] mt-[10px]">
    </h6>
    <h6 class="text-grey_5 font-medium flex flex-wrap justify-between">
      Distributed SSV Validators
      <!-- make it a button with a modal -->
      <span class="text-primary text-body font-bold sr-only s_sm:not-sr-only"> Learn More </span>
      <hr class="bg-grey_2 h-[2px] mt-[10px] w-full">
    </h6>
    <div class="h-[50%] overflow-auto">
      <div>
        Wallets here 
      </div>
    </div> 
    <div class="h-[48px] flex gap-[10px]">
      <button class="w-[90%] btn_primary font-bold">
        Next
      </button>
      <button class="min-w-[100px] w-[10%] btn_primary border border-primary bg-white text-primary">
        <i class="iconoir-undo-action text-[24px]" />
      </button>
    </div>
  </div>
</template>
