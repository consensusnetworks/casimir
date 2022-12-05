<script lang="ts" setup>
import { ref } from 'vue'


// eslint-disable-next-line no-undef
const props = defineProps({
    toggleModal: {
        type: Function,
        required: true
    }
})

const currentBalance = ref('45 ETH | $123,123.11')

</script>
  
<template>
  <div
    class="h-full"
  >
    <div class="flex items-center mb-[20px]">
      <h5 class="font-bold flex items-center gap-[10px]">
        <img
          src="/ETH.svg"
          alt="eth icon"
          class="w-[24px] h-[24px]"
        >
        ETH 2.0
        <div>
          <span class="font-semibold text-primary text-body sr-only s_sm:not-sr-only">
            {{ currentBalance }}
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
