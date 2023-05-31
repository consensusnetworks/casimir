<script setup lang="ts">
import Staking from './components/Staking.vue'
import Announcements from './components/Announcements.vue'
import StakingAvg from './components/StakingAvg.vue'
import BreakdownChart from './components/BreakdownChart.vue'
import BreakdownTable from './components/BreakdownTable.vue'

</script>

<template>
  <div class="px-[60px] pt-[51px]">
    <h6 class="title mb-[37px]">
      Breakdown
    </h6>

    <div class="flex 1100s:flex-wrap justify-between items-start gap-[63px] text-white h-[541px] 1100s:h-max mb-[47px]">
      <div class="h-full w-full">
        <BreakdownChart />
      </div>
      <div class="max-w-[300px] w-full h-full">
        <Staking />
      </div>
      <div class="max-w-[300px] w-full sr-only 1100s:not-sr-only">
        <div class="w-full mb-[37px]">
          <StakingAvg /> 
        </div>
        <div class="w-full h-[261px]">
          <Announcements />
        </div>
      </div>
    </div>
    <div class="flex justify-between items-start gap-[63px] text-white">
      <div class="w-full h-full">
        <BreakdownTable />
      </div>
      <div class="max-w-[300px] w-full 1100s:sr-only not-sr-only">
        <div class="w-full mb-[37px]">
          <StakingAvg /> 
        </div>
        <div class="w-full h-[261px]">
          <Announcements />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.title{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 24px;
    line-height: 31px;
    letter-spacing: -0.03em;
    color: #FFFFFF;
}
</style>