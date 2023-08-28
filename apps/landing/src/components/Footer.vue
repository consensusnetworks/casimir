<script lang="ts" setup>
import { ref } from 'vue'
import TermsOfService from './TermsOfService.vue'

const showTermsOfUse = ref(false)

</script>

<template>
  <div class="flex items-center justify-between gap-[10px] bg-black py-[8px] text-white">
    <p class="text-[12px] font-[500]">
      All Rights Reserved
    </p>

    <button
      class="text-[12px] font-[500] hover:text-grey_3"
      @click="showTermsOfUse = true"
    >
      Terms Of Use
    </button>

    <!-- Terms of Use -->
    <div
      v-show="showTermsOfUse"
      class="fixed bottom-0 left-0 flex items-center justify-center px-[10%] 
      py-[15%] z-[4] w-full h-screen bg-black/[0.75]"
      @click="showTermsOfUse =false"
    >
      <div class="bg-white h-full w-full overflow-auto rounded-[3px]">
        <TermsOfService class="px-[30px] py-[20px]" />
      </div>
    </div>
  </div>
</template>


<style scoped>
</style>