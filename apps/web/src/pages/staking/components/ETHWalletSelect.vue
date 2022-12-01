<script lang="ts" setup>
import { ref, watch } from 'vue'

const connectedWallets = ref([
    {
        name: 'Metamask',
        icon: '/metamask.svg',
        accounts: [
            {
                name: 'Acount One',
                address: ';aalskdkfj;alsdk;fj',
                amount: '32 ETH'
            },
            {
                name: 'Acount Two',
                address: ';alskddkfj;alsdk;fj',
                amount: '0 ETH'
            },
        ]
    },
    {
        name: 'Coinbase',
        icon: '/coinbase.svg',
        accounts: [
            {
                name: 'Acount One',
                address: ';alskdkfgj;alsdk;fj',
                amount: '48 ETH'
            },
            {
                name: 'Acount Two',
                address: ';alskdkfj;adlsdk;fj',
                amount: '20 ETH'
            },
        ]
    },
])

const maxAmmountToStake = ref(100)

const amountToStake = ref(0.00)

const disableNext = ref(true)

const selectedWalletToStakeFrom = ref(
    {
        name: '',
        address: '',
        amount: ''
    }
)

watch([amountToStake, selectedWalletToStakeFrom], () => {
    if(!(/^[0-9.,]+$/.test(amountToStake.value + ''))){
        amountToStake.value = 0.00
    }
    if(amountToStake.value > maxAmmountToStake.value){
        amountToStake.value = maxAmmountToStake.value
    }

    if(
        amountToStake.value > 0 &&
        selectedWalletToStakeFrom.value.address.length > 0
    ) {
        disableNext.value = false
    } else { disableNext.value = true}
})


</script>
  
<template>
  <div
    class="flex flex-col h-full overflow-auto relative"
  >
    <h6 class="text-grey_5 font-medium mb-[20px] truncate">
      Select wallet and amount to stake to our Distributed SSV Validators
      <hr class="bg-grey_2 h-[2px] mt-[10px]">
    </h6>
    <!-- Add tooltip of min and max -->
    <div class="slider mb-[20px]">
      <div class="border border-grey px-[16px] py-[8px] flex justify-between gap-[10px] items-center">
        <input
          v-model="amountToStake"
          type="text"
          placeholder="0.00"
          class="p-0 w-[65px] outline-none text-grey_5"
        >
        <h6 class="text-primary">
          | ETH to Stake
        </h6>
      </div>
      <input
        v-model="amountToStake"
        type="range"
        min="0.0"
        step="0.0001"
        :max="maxAmmountToStake"
        class="sr-only s_xsm:not-sr-only"
      >
    </div> 
    <hr>
    <div class="h-[40vh] overflow-auto">
      <div
        v-for="item in connectedWallets"
        :key="`${item as any}`"
        class="w-full border border-grey my-[10px]"
      >
        <div class="flex justify-between items-center px-[12px] py-[6px]">
          <img
            :src="item.icon"
            :alt="item.name"
            class="w-[24px]"
          >
          <h6 class="font-semibold text-blue_3">
            {{ item.name }}
          </h6>
        </div>
        <div
          v-for="account in item.accounts"
          :key="`${account as any}`"
          class="flex justify-between items-center my-[20px] px-[12px] py-[6px] hover:bg-blue_3 cursor-pointer"
          :class="selectedWalletToStakeFrom.address === account.address? 'bg-blue_3 hover:bg-blue_2' : ''"
          @click="selectedWalletToStakeFrom = account"
        >
          <h6 class="text-grey_6 font-semibold">
            {{ account.name }} | 
            <span class="px-[6px] text-grey_2  sr-only s_xsm:not-sr-only">{{ account.address }}</span>
          </h6>
          <h6 class="text-grey_5 font-light">
            {{ account.amount }}
          </h6>
        </div>
      </div>
    </div> 
    <hr>
    
    <div class="absolute bottom-0 w-full flex justify-between items-center gap-[10px] mt-[20px]">
      <RouterLink
        :to="!disableNext? '/Staking/ETH/Confirm-Stake' : '/Staking/ETH/Select-Wallet'"
        :style="{
          width: 'calc(100% - 100px)'
        }"
      >
        <button
          class="w-full btn_primary font-bold text-body py-[8px]"
          :disabled="disableNext"
        >
          Next
        </button>
      </RouterLink>
      
      <RouterLink
        to="/Staking/ETH"
        class="w-[100px]"
      >
        <button class="w-full btn_primary hover:bg-grey_1 border py-[8px] border-primary bg-white text-primary">
          <i class="iconoir-undo-action text-[16px]" />
        </button>
      </RouterLink>
    </div>
  </div>
</template>
