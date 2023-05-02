<script setup lang="ts">
import Balance from './components/Balance.vue'
import TotalStaked from './components/TotalStaked.vue'
import StakingRewards from './components/StakingRewards.vue'
import Staking from './components/Staking.vue'
import Announcements from './components/Announcements.vue'

</script>

<template>
  <div class="px-[60px] pt-[51px]">
    <h6 class="title mb-[37px]">
      Breakdown
    </h6>

    <div class="flex justify-between items-start gap-[63px] text-white">
      <div class="w-full">
        <div class="w-full flex justify-between gap-30 items-start mb-[32px]">
          <div class="h-[127px] w-full">
            <Balance />
          </div>
          <div class="h-[127px] w-full">
            <TotalStaked />
          </div>
          <div class="h-[127px] w-full">
            <StakingRewards />
          </div>
        </div>

        <div class="w-full h-[447px] border mb-[61px]">
          Cross Provider chart
        </div>

        <div class="w-full h-[805px] border">
          Staking Providers Table
        </div>
      </div>

      <div class="max-w-[300px] w-full">
        <div class="w-full h-[494px]">
          <Staking />
        </div>
        <div class="border w-full h-[386px] my-[31px]">
          Rewards 
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