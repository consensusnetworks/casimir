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

    <div class="flex justify-between 1000s:flex-wrap items-start gap-[63px] mb-[47px]">
      <div class="w-full h-[541px] 800s:h-max">
        <BreakdownChart />
      </div>

      <div class="w-full max-w-[300px] 1000s:max-w-none 1000s:flex 700s:flex-wrap justify-between gap-[63px] items-start">
        <div class="w-full">
          <Staking />
        </div>
        <div class="w-[0px] 1000s:w-full">
          <div class="sr-only 1000s:not-sr-only">
            <div class="w-full mb-[37px]">
              <StakingAvg /> 
            </div>
            <div class="w-full h-[261px]">
              <Announcements />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full flex justify-between items-start gap-[63px]">
      <div class="h-full w-full overflow-auto">
        <BreakdownTable />
      </div>
      <div class="1000s:sr-only not-sr-only">
        <div class="w-[300px]">
          <div class="w-full mb-[37px]">
            <StakingAvg /> 
          </div>
          <div class="w-full h-[261px]">
            <Announcements />
          </div>
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