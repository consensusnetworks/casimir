<script lang="ts" setup>
import { ref } from 'vue'
import useFormat from '@/composables/format'
import useUsers from '@/composables/users'
import USDAmount from '@/components/USDAmount.vue'

const { formatDecimalString } = useFormat()
const { user } = useUsers()

</script>
  
<template>
  <div class="h-full flex flex-col gap-[15px]">
    <!-- add rotating pills here when in overflow -->
    <div>
      <div
        id="pills_container"
        class="flex w-full overflow-auto gap-[20px]"
      >
        <div class="pill_primary whitespace-nowrap">
          <span class="text-grey_5 mr-[5px]">
            Staked 
          </span>
          <span class="flex">
            {{ formatDecimalString(user.stake || '0.0') }} |&nbsp;<USDAmount :ether-amount="(user.stake || '0.0')" />
          </span>
        </div>
        <div class="pill_primary whitespace-nowrap">
          <span class="text-grey_5 mr-[5px]">
            Rewards 
          </span>
          <span class="flex">
            {{ formatDecimalString(user.rewards || '0.0') }} |&nbsp;<USDAmount :ether-amount="(user.rewards || '0.0')" />
          </span>
        </div>
        <div class="pill_primary whitespace-nowrap">
          <span class="text-grey_5 mr-[5px]">
            APR 
          </span>
          <span class="flex">
            5.67%
          </span>
        </div>
      </div>
    </div>
    
    <div class="h-full overflow-auto border-y border-grey">
      <div
        v-if="(user.pools?.length === 0)"
        class="h-full grid place-content-center"
      >
        <h6 class="text-grey_5">
          You currently do not have any active pools
        </h6>
      </div>
      <div
        v-for="pool in user.pools"
        :key="`${pool as any}`"
        class="border border-grey_2 border-[1px] p-[15px] mb-[55px]"
      >
        <div class="">
          <!-- <h6 class="font-bold text-grey_5 flex justify-between w-full">
            <span class="flex">
              {{ formatDecimalString(pool.userStake || '0.0') }} ETH |&nbsp;<USDAmount :ether-amount="(pool.userStake || '0.0')" />
            </span> 
            <div class="tooltip">
              <span class="text-grey_3 flex gap-[10px] sr-only s_xsm:not-sr-only">
                <span class="w-[100px] truncate">{{ user.id }}</span>
                <img
                  :src="'/metamask.svg'"
                  :alt="'MetaMask'"
                  class="w-[20px] opacity-[0.2]"
                >
              </span>
              <img
                :src="'/metamask.svg'"
                :alt="'MetaMask'"
                class="w-[20px] opacity-[0.2] s_xsm:sr-only not-sr-only"
              >
              <span class="tooltiptext text-body font-bold">
                MetaMask: {{ user.id }}
              </span>
            </div>
          </h6> -->
          <!-- <hr class="h-[2px] bg-grey my-[20px]">
          <h6 class="font-bold text-grey_3">
            Stake Distribution
          </h6> -->
          <!-- <div
            class="my-[20px] border border-grey border-dashed border-[2px] p-[15px]"
          > -->
          <div class="flex flex-wrap gap-[20px] justify-between items-center mb-[15px]">
            <h6 class="font-medium  text-grey_5">
              Pool #{{ pool.id }}
            </h6>
            <h6 class="font-medium text-grey_5">
              {{ pool.totalStake }} / 32 ETH
            </h6>
          </div>
          <hr class="h-[2px] bg-grey my-[20px]">
          <div
            v-if="!pool.validator"
          >
            <h6 class="font-medium w-full text-center text-decline p-[10px] border border-decline my-[15px]">
              Pool is currently open
            </h6>
          </div>
          <div
            v-else
            class="text-grey_5 whitespace-nowrap"
          >
            <h6 class="flex gap-[20px] flex-wrap justify-between items-center truncate mb-[20px]">
              <span>
                Rewards: {{ pool.userRewards }} ETH
              </span>
              <span>
                {{ pool.validator.apr }} validator APR
              </span>
            </h6>
            <h6 class="flex gap-[20px] flex-wrap justify-between items-center mb-[20px] truncate">
              <span class="min-w-[135px] w-[45%] flex gap-[5px] items-center">
                Validator: <span class="truncate">{{ pool.validator.publicKey }}</span> 
                <a
                  :href="pool.validator.url"
                  target="_blank"
                ><i class="iconoir-open-new-window text-primary" /></a>
              </span>
              <span>
                {{ pool.validator.effectiveness }} validator effectiveness 
              </span>
            </h6>
            <h6 class="flex gap-[20px] flex-wrap justify-between items-center truncate">
              <span>
                Operators:
                <a
                  v-for="operator in pool.operators"
                  :key="operator.id"
                  :href="operator.url"
                  target="_blank"
                >
                  <!-- Todo fix hardcoded check on the last operator -->
                  #{{ operator.id }}{{ operator.id === 594 ? '' : ', ' }}
                </a>
              </span>
            </h6>
          </div>
          <!-- </div> -->
        </div>
      </div>
    </div>
    <div class="flex justify-between items-center gap-[20px]">
      <RouterLink
        to="/stake/eth/select-wallet"
        class="w-full"
      >
        <button
          class="w-full btn_primary font-bold text-body py-[8px]"
        >
          Stake 
          <img
            src="/Staking-Icon.svg"
            alt="Staking Icon"
            class="w-[16px]"
          >
        </button>
      </RouterLink>
      <RouterLink
        to="/stake"
        class="w-[100px]"
      >
        <button class="w-full btn_primary hover:bg-grey_1 border py-[8px] border-primary bg-white text-primary">
          <i class="iconoir-undo-action text-[16px]" />
        </button>
      </RouterLink>
    </div>
  </div>
</template>
