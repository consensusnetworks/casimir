<script lang="ts" setup>
import * as d3 from 'd3'
import LineChart from '@/components/charts/LineChart.vue'
import { eth_staked_data } from './dummy_data.js'
import { ref } from 'vue'

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
  <div class="flex flex-col h-full w-full">
    <div class="flex items-center gap-15">
      <img
        src="/ETH.svg"
        alt=""
        class="w-30 h-30"
      >
      <h5 class="font-bold whitespace-nowrap">
        Ethereum Staking
      </h5>
    </div>
    <div class="my-25 flex items-center justify-between flex-wrap gap-25">
      <div class="flex gap-25 items-center flex-wrap">
        <button class="btn_text font-medium">
          ETH Staked
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
      <div class="-rotate-90">
        <span class="text-body text-grey_5 font-bold whitespace-nowrap">
          ETH Staked
        </span>
      </div>
      <div class="w-[100%] h-full">
        <LineChart 
          :data="eth_staked_data"
          :y-axis-value="'price'"
          :x-axis-value="'date'"
          :x-axis-format="xAxisFormat"
          :y-axis-format="yAxisFormat"
          :update-tooltip-info="updateTooltipInfo"
        />
      </div>
    </div>
    <div class="text-center w-full mb-25">
      <span class="text-body text-grey_5 font-bold whitespace-nowrap">
        Time ( {{ selectedTimeFrame }} )
      </span>
    </div>
    <div class="bg-blue_2 py-15 px-10 text-center">
      <h6 class="font-medium text-primary mb-10">
        Inorder to stake with us, you must connect your primary wallet
      </h6>
      <div>
        <span class="font-medium text-grey_5  text-body">
          Future protocals that you will be able to stake with us:
        </span>
        <div class="flex flex-wrap mt-10 gap-35 items-center justify-center w-full">
          <div class="flex items-center gap-5 text-caption font-bold text-grey_5">
            <img
              src="/iopay.svg"
              alt="IoPay Logo"
              class="w-25 h-25"
            > IoTeX
          </div>
          <div class="flex items-center gap-5 text-caption font-bold text-grey_5">
            <img
              src="/accumulate.svg"
              alt="Accumulate Logo"
              class="w-25 h-25"
            > Accumulate
          </div>
          <div class="flex items-center gap-5 text-caption font-bold text-grey_5">
            <img
              src="/livepeer.svg"
              alt="LivePeer Logo"
              class="w-25 h-25"
            > LivePeer
          </div>
          <div class="flex items-center gap-5 text-caption font-bold text-grey_5">
            <img
              src="/cosmos.svg"
              alt="Cosmos Logo"
              class="w-25 h-25"
            > Cosmos
          </div>
          <div class="flex items-center gap-5 text-caption font-bold text-grey_5">
            <img
              src="/solana.svg"
              alt="Solana Logo"
              class="w-25 h-25"
            > Solana
          </div>
        </div>
      </div>
    </div>
  </div>
</template>