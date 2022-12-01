<script lang="ts" setup>
import router from '@/composables/router'
import { ref } from 'vue'


const stakingInfo = ref(
    {
        to: 'Distributed SSV Validatore',
        ammount: '6 ETH',
        fees: '0.25 %',
        expectedRewards: '4.3 %',
        from: {
            name: 'Coinbase',
            icon: '/coinbase.svg',
            account: {
                name: 'Account One',
                balance: '48 ETH',
                address: 'asdfasdfasdf'
            }
        }
    }
)

const loading = ref(false)

const handleConfirm = () => {
    loading.value = true

    setTimeout(()=> {
        loading.value = false
        router.push('/Staking/ETH')
    }, 2000)
}

</script>
  
<template>
  <div
    class="flex flex-col h-full overflow-auto relative whitespace-nowrap"
  >
    <div class="mb-[30px]">
      <h6 class="text-grey_5 font-medium">
        Confirm Stake & Sign Transaction
      </h6>
    </div>

    <div class="flex flex-wrap justify-between items-center">
      <h6 class="text-grey_5">
        Staking To
      </h6>
      <h6 class="font-bold">
        {{ stakingInfo.to }}
      </h6>
    </div>
    <hr class="bg-grey h-[2px] my-[10px]">
    <div class="flex justify-between items-center">
      <h6 class="text-grey_5">
        Ammount Staking
      </h6>
      <h6 class="font-bold">
        {{ stakingInfo.ammount }}
      </h6>
    </div>
    <hr class="bg-grey h-[2px] my-[10px]">
    <div class="flex justify-between items-center">
      <h6 class="text-grey_5">
        Fees
      </h6>
      <h6 class="font-bold">
        {{ stakingInfo.fees }}
      </h6>
    </div>
    <hr class="bg-grey h-[2px] my-[10px]">
    <div class="flex justify-between items-center">
      <h6 class="text-grey_5">
        Expected Rewards
      </h6>
      <h6 class="font-bold">
        {{ stakingInfo.expectedRewards }}
      </h6>
    </div>
    
    <div class="my-[40px] border">
      <div class="flex justify-between items-center px-[12px] py-[24px]">
        <img
          :src="stakingInfo.from.icon"
          :alt="stakingInfo.from.name"
          class="w-[24px]"
        >
        <h6 class="font-semibold text-blue_3">
          {{ stakingInfo.from.name }}
        </h6>
      </div>
      <div
        class="flex justify-between items-center my-[20px] px-[12px] py-[6px]"
      >
        <h6 class="text-grey_6 font-semibold">
          {{ stakingInfo.from.account.name }} | 
          <span class="px-[6px] text-grey_2 sr-only s_xsm:not-sr-only">{{ stakingInfo.from.account.address }}</span>
        </h6>
        <h6 class="text-grey_5 font-light">
          {{ stakingInfo.from.account.balance }}
        </h6>
      </div>
    </div>

    <div class="absolute bottom-0 w-full flex justify-between items-center gap-[10px] mt-[20px]">
      <button
        class="w-full btn_primary font-bold text-body py-[8px]"
        :class="loading? 'loading' : ''"
        @click="handleConfirm"
      >
        Sign Transaction
      </button>
      
      <RouterLink
        to="/Staking/ETH/Select-Wallet"
        class="w-[100px]"
      >
        <button class="w-full btn_primary hover:bg-grey_1 border py-[8px] border-primary bg-white text-primary">
          <i class="iconoir-undo-action text-[16px]" />
        </button>
      </RouterLink>
    </div>
  </div>
</template>
