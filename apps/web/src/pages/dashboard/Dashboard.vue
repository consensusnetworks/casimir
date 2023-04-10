<script lang="ts" setup>
import Analytics from './components/Analytics.vue'
import Stake from './components/Stake.vue'
// import DataTable from './components/DataTable.vue'

</script>

<template>
  <div class="grid grid-cols-8 gap-[24px] pb-45">
    <div class="col-span-4 h-[480px] 1000s:col-span-8">
      <Analytics />
    </div> 
    <div class="col-span-1 h-[480px] not-sr-only 1000s:sr-only" />
    <div class="col-span-3 h-[480px] 1000s:col-span-8">
      <Stake />
    </div>
    <!-- <div class="col-span-8 h-[300px] pb-45">
      <div class="w-full h-full flex flex-col gap-20">
        <div>
          <h6 class="font-bold text-[#727476]">
            Table
          </h6>
        </div>

        <div class="w-full border border-border rounded-[5px] h-full">
          <DataTable />
        </div>
      </div>
    </div> -->
  </div>
</template>