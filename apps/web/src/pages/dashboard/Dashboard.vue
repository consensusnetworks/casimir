<script lang="ts" setup>
import Analytics from './components/Analytics.vue'
import Stake from './components/Stake.vue'
import DataTable from './components/DataTable.vue'
import { onMounted, ref } from 'vue'
import useWallet from '@/composables/wallet'

const { setUserAccountBalances } = useWallet()

const loadingSkeletons = ref(false)

onMounted(async () => {
  loadingSkeletons.value = true
  await setUserAccountBalances()
  setTimeout(() => {
    loadingSkeletons.value = false
  }, 500)
})



</script>

<template>
  <div
    v-if="!loadingSkeletons"
    class="grid grid-cols-8 gap-[24px] pb-45"
  >
    <div class="col-span-3 h-[480px] 1000s:col-span-8">
      <Stake />
    </div>
    
    <div class="col-span-1 h-[480px] not-sr-only 1000s:sr-only" />
    
    <div class="col-span-4 h-[480px] 1000s:col-span-8">
      <Analytics />
    </div> 
    <div class="col-span-8 pb-45 mt-50">
      <DataTable />
    </div>
  </div>
  <div
    v-else 
    class="grid grid-cols-8 gap-[24px] pb-45"
  >
    <div class="col-span-3 h-[480px] 1000s:col-span-8 loading_grey rounded-[5px]" />
    
    <div class="col-span-1 h-[480px] not-sr-only 1000s:sr-only" />
    
    <div class="col-span-4 h-[480px] 1000s:col-span-8 loading_grey rounded-[5px]" /> 
    <div class="col-span-8 pb-45 mt-50 h-[480px] loading_grey rounded-[5px]" />
  </div>
</template>