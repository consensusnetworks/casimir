<script lang="ts" setup>
import * as d3 from 'd3'
import { ref } from 'vue'
import { eth_staked_data } from './composables/dummy_data.js'
import LineChart from '@/components/charts/LineChart.vue'
import AssetBreakdown from './components/AssetBreakdown.vue'
import TokenUpdates from './components/TokenUpdates.vue'
import StakingBreakdown from './components/StakingBreakdown.vue'
import MultiwalletConnect from '@/components/navigation/components/MultiwalletConnect.vue'

const xAxisFormat = (d: string) => {
  const label = new Date(d).toDateString().split(' ')
  if(label[1] === 'Jan'){
      return label[3]
  } else {
      return label[1]
  }
}
const formatSi = d3.format('.2s')
const yAxisFormat = (x: string) => {
    const s = formatSi(x)
    switch (s[s.length - 1]) {
        case ' G ': return s.slice(0, -1) + ' B ' // billions
        case ' k ': return s.slice(0, -1) + ' K ' // thousands
    }
    return s
}

const toolTipAmount = ref('2020')
const updateTooltipInfo = (e: string) => {
    toolTipAmount.value = e + ' ETH'
}

const selectedTimeFrame = ref('Hour')
</script>
  
<template>
  <div
    class="flex flex-col gap-15 h-max w-full pb-10"
  >
    <div class="">
      <h5 class="font-bold whitespace-nowrap">
        Your Assets
      </h5>
    </div>
    <div 
      class="reverse_two_thirds_one_third_grid_to_full 
      dash_s_sm:two_thirds_one_third_grid_to_full gap-15"
    >
      <div class="h-[300px] mb-25">
        <div class="flex items-center justify-between flex-wrap gap-25">
          <div class="flex gap-10 items-center flex-wrap ">
            <button class="btn_text font-medium text-body">
              Net Worth Value
            </button>
            <span class="text-grey_5 font-light">|</span>
            <button 
              class="btn_text px-0"
              :class="selectedTimeFrame === 'Hour'? 'text-primary font-medium': 'text-grey_5 font-light'"
              @click="selectedTimeFrame = 'Hour'"
            >
              Hour
            </button>
            <button  
              class="btn_text px-0"
              :class="selectedTimeFrame === 'Week'? 'text-primary font-medium': 'text-grey_5 font-light'"
              @click="selectedTimeFrame = 'Week'"
            >
              Week
            </button>
            <button 
              class="btn_text px-0"
              :class="selectedTimeFrame === 'Month'? 'text-primary font-medium': 'text-grey_5 font-light'"
              @click="selectedTimeFrame = 'Month'"
            >
              Month
            </button>
            <button 
              class="btn_text px-0"
              :class="selectedTimeFrame === 'Year'? 'text-primary font-medium': 'text-grey_5 font-light'"
              @click="selectedTimeFrame = 'Year'"
            >
              Year
            </button>
          </div>
          <div>
            <h6 class="text-grey_5 text-body font-bold">
              {{ toolTipAmount }}
            </h6>
          </div>
        </div>
        <div class="flex items-center h-full">
          <div class="-rotate-90 whitespace-nowrap text-caption font-blue w-20 text-grey_5">
            NW [$]
          </div>
          <div class="w-full h-full">
            <LineChart 
              :data="eth_staked_data"
              :y-axis-value="'price'"
              :x-axis-value="'date'"
              :x-axis-format="xAxisFormat"
              :y-axis-format="yAxisFormat"
              :update-tooltip-info="updateTooltipInfo"
              :chart-id="'dashboard_networth_chart'"
            />
          </div>
        </div>
      </div>
      <div class="h-[300px] mb-25">
        <AssetBreakdown />
      </div>
    </div>
    <div
      class="
      reverse_two_thirds_one_third_grid_to_full 
      dash_s_sm:two_thirds_one_third_grid_to_full
      border-t pt-25 gap-15
      "
    >
      <div class="h-[300px] grid grid-cols-2 gap-20 mb-25">
        <TokenUpdates class="col-span-1" />
        <StakingBreakdown />
      </div>
      <div class="h-max dash_s_sm:h-[300px] mb-25 dash_s_sm:pl-20 mt-50 dash_s_sm:mt-0"> 
        <div class="min-w-[375px] w-full h-full flex flex-col">
          <h6 class="font-medium text-grey_8 mb-10 sticky">
            Recent Transactions
          </h6>
          <div class=" h-full w-full overflow-auto">
            <div
              v-for="i in 6"
              :key="i"
              class="py-10 px-10 border-b border-b-grey_3 mb-15 mt-10"
            >
              <div class="flex justify-between items-center">
                <span class="text-body font-medium text-grey_6">
                  Description Name
                </span>
                <span class="text-body font-medium text-grey_3">
                  01/01/2023 | 00:00 AM
                </span>
              </div>
              <div class="flex justify-between items-center mt-15">
                <span class="text-body font-medium text-grey_6">
                  Wallet Address...
                </span>
                <span class="text-body font-medium text-grey_3">
                  Token Amount | Exchange Amount
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

