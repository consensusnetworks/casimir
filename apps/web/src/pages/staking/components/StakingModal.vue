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
  <div class="flex flex-col min-w-[300px] w-full min-h-[500px] h-[80vh]">
    <div class="flex items-center justify-between mb-[20px]">
      <h5 class="font-bold flex items-center gap-[10px]">
        <img
          src="/ETH.svg"
          alt="eth icon"
          class="w-[24px] h-[24px]"
        >
        ETH Staking
        <div>
          <span class="font-semibold text-primary text-body sr-only s_sm:not-sr-only">
            {{ currentBalance }}
          </span>
        </div>
      </h5>
      <RouterLink to="/Staking">
        <button
          class="btn_primary px-[12px] py-[6px] bg-white text-black hover:bg-grey_1"
          @click="toggleModal(null)"
        >
          <i
            class="iconoir-cancel font-bold text-[24px]"
          />
        </button>
      </RouterLink>
    </div>
    <div class="h-full">
      <slot />
    </div>
  </div>
</template>
