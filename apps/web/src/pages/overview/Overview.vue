<script setup lang="ts">
// import Balance from './components/Balance.vue'
// import TotalStaked from './components/TotalStaked.vue'
// import StakingRewards from './components/StakingRewards.vue'
import Staking from './components/Staking.vue'
import Announcements from './components/Announcements.vue'
import StakingAvg from './components/StakingAvg.vue'
import BreakdownChart from './components/BreakdownChart.vue'
import StakingProvidersTable from './components/StakingProvidersTable.vue'

</script>

<template>
  <div class="px-[60px] pt-[51px]">
    <h6 class="title mb-[37px]">
      Breakdown
    </h6>

    <div class="flex justify-between items-start gap-[63px] text-white h-[541px] mb-[47px]">
      <div class="w-full h-full">
        <BreakdownChart />
      </div>
      <div class="max-w-[300px] w-full h-full">
        <Staking />
      </div>
    </div>
    <div class="flex justify-between items-start gap-[63px] text-white">
      <div class="w-full h-full">
        <StakingProvidersTable />
      </div>
      <div class="max-w-[300px] w-full">
        <div class="w-full h-[386px] mb-[31px]">
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