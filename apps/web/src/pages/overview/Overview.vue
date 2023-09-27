<script setup lang="ts">
import Staking from './components/Staking.vue'
import Announcements from './components/Announcements.vue'
import StakingAvg from './components/StakingAvg.vue'
import BreakdownChart from './components/BreakdownChart.vue'
import BreakdownTable from './components/BreakdownTable.vue'

import useUser from '@/composables/user'
import useBreakdownMetrics from '@/composables/breakdownMetrics'
import useAnalytics from '@/composables/analytics'
import useOperators from '@/composables/operators'

const {loadingSessionLogin} = useUser()
const {loadingInitializeBreakdownMetrics} = useBreakdownMetrics()
const {loadingInitializeAnalytics} = useAnalytics()
const {loadingInitializeOperators} = useOperators()
</script>

<template>
  <div class="px-[60px] 800s:px-[5%] pt-[51px] text-white">
    <h6 class="title mb-[37px] relative">
      <div
        v-show="loadingSessionLogin || loadingInitializeBreakdownMetrics || loadingInitializeAnalytics || loadingInitializeOperators"
        class="absolute top-0 left-0 w-full h-full z-[2] rounded-[3px] overflow-hidden"
      >
        <div class="skeleton_box" />
      </div>
      Breakdown
    </h6>

    <div class="flex justify-between 1000s:flex-wrap items-start gap-[63px] mb-[47px] w-full">
      <div class=" h-[541px] 800s:h-max dynamic_width relative">
        <div
          v-show="loadingSessionLogin || loadingInitializeBreakdownMetrics || loadingInitializeAnalytics || loadingInitializeOperators"
          class="absolute top-0 left-0 w-full h-full z-[2] rounded-[3px] overflow-hidden"
        >
          <div class="skeleton_box" />
        </div>
        <BreakdownChart />
      </div>
      <div class="w-full max-w-[300px] 1000s:max-w-none 1000s:flex 700s:flex-wrap justify-between gap-[63px] items-start">
        <div class="w-full relative">
          <Staking view-id="full_view" />
          <div
            v-show="loadingSessionLogin || loadingInitializeBreakdownMetrics || loadingInitializeAnalytics || loadingInitializeOperators"
            class="absolute top-0 left-0 w-full h-full z-[2] rounded-[3px] overflow-hidden"
          >
            <div class="skeleton_box" />
          </div>
        </div>
        <div class="w-[0px] 1000s:w-full">
          <div class="sr-only 1000s:not-sr-only">
            <div class="w-full mb-[37px] relative">
              <div 
                v-show="loadingSessionLogin || loadingInitializeBreakdownMetrics || loadingInitializeAnalytics || loadingInitializeOperators"
                class="absolute top-0 left-0 w-full h-full z-[2] rounded-[3px] overflow-hidden"
              >
                <div class="skeleton_box" />
              </div>
              <StakingAvg view-id="small_view" /> 
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full flex justify-between items-start gap-[63px]">
      <div class="h-full w-full overflow-auto relative">
        <div
          v-show="loadingSessionLogin || loadingInitializeBreakdownMetrics || loadingInitializeAnalytics || loadingInitializeOperators"
          class="absolute top-0 left-0 w-full h-full z-[2] rounded-[3px] overflow-hidden"
        >
          <div class="skeleton_box" />
        </div>
        <BreakdownTable />
      </div>
      <div class="1000s:sr-only not-sr-only">
        <div class="w-[300px]">
          <div class="w-full mb-[37px] relative">
            <StakingAvg view-id="full_view" /> 
            <div
              v-show="loadingSessionLogin || loadingInitializeBreakdownMetrics || loadingInitializeAnalytics || loadingInitializeOperators"
              class="absolute top-0 left-0 w-full h-full z-[2] rounded-[3px] overflow-hidden"
            >
              <div class="skeleton_box" />
            </div>
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

.dynamic_width{
  width: calc(100% - 363px);
  @media (max-width: 1000px) {
      width: 100%
  };
}
</style>