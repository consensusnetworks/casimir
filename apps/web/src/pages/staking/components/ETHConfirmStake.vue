<script lang="ts" setup>
import router from '@/composables/router'
import { ref } from 'vue'
import useFormat from '@/composables/format'
import useUsers from '@/composables/users'
import useWallet from '@/composables/wallet'
import useSSV from '@/composables/ssv'

const { formatDecimalString } = useFormat()
const { user } = useUsers()
const { amountToStake, selectedProvider, deposit } = useWallet()
const { getSSVFeePercent } = useSSV()

async function getFee() {
  try {
    const fee = await getSSVFeePercent(selectedProvider.value)
    if (fee % 1 === 0) {
        return `${fee}.00%`
    }
    return `${fee}%`
  } catch (err){
    console.error(err)
    return 'Error connecting to SSV network. Please try again momentarily.'
  }
}

const stakingInfo = ref(
    {
        to: 'Distributed SSV Validator',
        amount: formatDecimalString(amountToStake.value),
        fees: await getFee(),
        expectedRewards: '5.67%',
        from: {
            name: 'MetaMask',
            icon: '/metamask.svg',
            account: {
                name: 'Primary Account',
                balance: formatDecimalString(user.value.balance || '0.0'),
                address: user.value.id
            }
        }
    }
)

const loading = ref(false)

const handleConfirm = async () => {
  loading.value = true
  await deposit()
  loading.value = false
  router.push('/stake/eth')
}

</script>
  
<template>
  <div class="h-full flex flex-col gap-[15px]">
    <h6 class="text-grey_5 font-medium">
      Confirm Stake & Sign Transaction
    </h6>
    <hr class="bg-grey_2 h-[2px]">
    <div class="h-full overflow-auto">
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
          Amount Staking
        </h6>
        <h6 class="font-bold">
          {{ stakingInfo.amount }} ETH
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
            {{ stakingInfo.from.account.balance }} ETH
          </h6>
        </div>
      </div>
    </div>
    <div class="flex justify-between items-center gap-[20px]">
      <button
        class="w-full btn_primary font-bold text-body py-[8px] whitespace-nowrap"
        :class="loading? 'loading' : ''"
        @click="handleConfirm"
      >
        Sign Transaction
      </button>
      
      <RouterLink
        to="/stake/eth/select-wallet"
        class="w-[100px]"
      >
        <button class="w-full btn_primary hover:bg-grey_1 border py-[8px] csm:px-[4px] border-primary bg-white text-primary">
          <i class="iconoir-undo-action text-[16px]" />
        </button>
      </RouterLink>
    </div>
  </div>
</template>
