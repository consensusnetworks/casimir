<script lang="ts" setup>
import Analytics from './components/Analytics.vue'
import Stake from './components/Stake.vue'
import DataTable from './components/DataTable.vue'
import { onMounted } from 'vue'
import useWallet from '@/composables/wallet'

const { setUserAccountBalances } = useWallet()

onMounted(async () => {
  await setUserAccountBalances()
})

</script>

<template>
  <div class="grid grid-cols-8 gap-[24px] pb-45">
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
</template>