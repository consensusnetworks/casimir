<script lang="ts" setup>
import useFormat from '@/composables/format'
import useUsers from '@/composables/users'
import USDAmount from '@/components/USDAmount.vue'

const { formatDecimalString } = useFormat()
const { user } = useUsers()

</script>
  
<template>
  <div
    class="h-full"
  >
    <div class="flex items-center mb-[20px]">
      <h5 class="flex items-center gap-[10px]">
        <img
          src="/ETH.svg"
          alt="eth icon"
          class="w-[24px] h-[24px]"
        >
        ETH
        <div class="tooltip">
          <span class="flex font-semibold text-primary text-body sr-only s_sm:not-sr-only">
            {{ formatDecimalString(user.balance || '0.0') }} |&nbsp;<USDAmount :ether-amount="(user.balance || '0.0')" />
          </span>
          <span class="tooltiptext text-body font-bold">
            Balance is summed up from all connected wallets
          </span>
        </div>
      </h5>
    </div>
    <div
      :style="{height: 'calc(100% - 45px)'}"
      class="overflow-auto"
    >
      <slot />
    </div>
  </div>
</template>
