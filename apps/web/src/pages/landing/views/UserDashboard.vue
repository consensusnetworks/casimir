<script lang="ts" setup>
import * as d3 from 'd3'
import { ref } from 'vue'
import PositiveChart from '@/components/PositiveChart.vue'
import NegativeChart from '@/components/NegativeChart.vue'
import { eth_staked_data } from '../composables/dummy_data.js'
import LineChart from '@/components/charts/LineChart.vue'
import AssetBreakdown from '../components/AssetBreakdown.vue'

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
  <div class="flex flex-col gap-15 h-max w-full pb-10">
    <div class="">
      <h5 class="font-bold whitespace-nowrap">
        Your Assets
      </h5>
    </div>
    <div class="flex h-[300px] justify-between gap-15 border-b pb-20 mb-10 ">
      <div class="w-2/3 h-full flex flex-col gap-25">
        <div class="flex items-center justify-between flex-wrap gap-25">
          <div class="flex gap-25 items-center flex-wrap ">
            <button class="btn_text font-medium">
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
            <h6 class="text-grey_5 font-bold">
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
      <AssetBreakdown />
    </div>
    <div class="flex h-full justify-between gap-15 ">
      <div class="w-full h-full flex gap-15 justify-between">
        <div class="flex flex-col gap-10 w-1/3 overflow-auto">
          <h6 class="font-medium text-grey_8 mb-10">
            Token Updates
          </h6>
          <div class="w-full py-12 px-20 border border-grey_2 flex justify-between gap-15 items-center">
            <div class="flex gap-10 items-center h-full">
              <img
                src="/BTC.svg"
                alt="Bitcoin Icon"
                class="h-30 w-30"
              >
              <div class="flex flex-col">
                <span class="font-medium text-body text-grey_5">
                  BTC
                </span>
                <span class="text-caption text-grey_4">
                  $132,123.23 
                </span>
              </div>
            </div>
            
            <div class="flex items-center gap-10 h-full">
              <div class="h-full w-[50px]">
                <PositiveChart :chart-id="'BTC_chart'" />
              </div>
              <div class="text-body font-bold text-[#36B159]">
                +2.3 %
              </div>
            </div>
          </div>
          <div class="w-full py-12 px-20 border border-grey_2 flex justify-between gap-15 items-center">
            <div class="flex gap-10 items-center h-full">
              <img
                src="/solana.svg"
                alt="Solana Icon"
                class="h-30 w-30"
              >
              <div class="flex flex-col">
                <span class="font-medium text-body text-grey_5">
                  Solana
                </span>
                <span class="text-caption text-grey_4">
                  $132,123.23 
                </span>
              </div>
            </div>
            <div class="flex items-center gap-10 h-full">
              <div class="h-full w-[50px]">
                <NegativeChart :chart-id="'SOL_chart'" />
              </div>
              <div class="text-body font-bold text-[#DF3A3A]">
                +2.3 %
              </div>
            </div>
          </div>
          <div class="w-full py-12 px-20 border border-grey_2 flex justify-between gap-15 items-center">
            <div class="flex gap-10 items-center h-full">
              <img
                src="/IOTX.svg"
                alt="IoTeX Icon"
                class="h-30 w-30"
              >
              <div class="flex flex-col">
                <span class="font-medium text-body text-grey_5">
                  IoTeX
                </span>
                <span class="text-caption text-grey_4">
                  $132,123.23 
                </span>
              </div>
            </div>
            <div class="flex items-center gap-10 h-full">
              <div class="h-full w-[50px]">
                <PositiveChart :chart-id="'IOTEX_chart'" />
              </div>
              <div class="text-body font-bold text-[#36B159]">
                +2.3 %
              </div>
            </div>
          </div>
          <div class="w-full py-12 px-20 border border-grey_2 flex justify-between gap-15 items-center">
            <div class="flex gap-10 items-center h-full">
              <img
                src="/eth.svg"
                alt="ETH Icon"
                class="h-30 w-30"
              >
              <div class="flex flex-col">
                <span class="font-medium text-body text-grey_5">
                  ETH
                </span>
                <span class="text-caption text-grey_4">
                  $132,123.23 
                </span>
              </div>
            </div>
            <div class="flex items-center gap-10 h-full">
              <div class="h-full w-[50px]">
                <NegativeChart :chart-id="'ETH_chart'" />
              </div>
              <div class="text-body font-bold text-[#DF3A3A]">
                +2.3 %
              </div>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-15 w-2/3 h-full">
          <div class=" h-full">
            <h6 class="font-medium text-grey_8 mb-10">
              Recent Transactions
            </h6>
            <div
              v-for="i in 4"
              :key="i"
              class="py-10 border-b border-b-grey_3"
            >
              <div class="flex justify-between items-center">
                <span class="text-body font-medium text-grey_6">
                  Description Name [Wallet Provider]
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