<script lang="ts" setup>
import { ref } from 'vue'

const toolTipAmount = ref('2020')
const updateTooltipInfo = (e: string) => {
    toolTipAmount.value = e + ' ETH'
}

const selectedTimeFrame = ref('Hour')
</script>
  
<template>
  <div class="flex flex-col gap-15 h-full w-full">
    <div class="flex items-center gap-15">
      <h5 class="font-bold whitespace-nowrap">
        Your Assets
      </h5>
    </div>
    <div class="flex h-full min-h-[150px] items-center justify-between gap-15">
      <div class="flex flex-col w-2/3 h-full">
        <div class="mb-25 flex items-center justify-between flex-wrap gap-25">
          <div class="flex gap-25 items-center flex-wrap ">
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
        <div class="border h-full w-full">
          chart
        </div>
      </div>
      <div class="flex flex-col w-1/3 h-full">
        <div class="mb-25 flex items-center mt-5">
          <span class="text-body text-grey_5 font-bold">
            Asset Breakdown
          </span>
        </div>
        <div class="w-full h-full flex flex-row gap-15">
          <div class="w-full flex flex-col gap-10">
            <div>
              <span class="text-caption font-bold text-grey_5">Wallets</span>
            </div>
            <div class="h-full w-full">
              wallets...
            </div>
          </div>
          <div class="w-full flex flex-col gap-10">
            <div>
              <span class="text-caption font-bold text-grey_5">Tokens</span>
            </div>
            <div class="h-full w-full">
              tokens...
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex h-full items-center justify-between gap-15">
      <div class="w-full h-full border">
        pie chart / transactions
      </div>
    </div>
  </div>
</template>