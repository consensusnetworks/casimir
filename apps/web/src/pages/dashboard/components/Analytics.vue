<script lang="ts" setup>
import { ref } from 'vue'
import LineChartJS from '@/components/charts/LineChartJS.vue'

const selectedTimeframe = ref('All Time')
const selectedNetMetric = ref('Net Value')
const openFilters = ref(false)
const net_value_filter = ref('eth')
const net_volume_filter = ref('all')
const roi_metric = ref(-4.2)
const allTimeHigh = ref({date: '01/01/2023', value: '$10,245.21'})
const allTimeLow = ref({date: '12/12/2023', value: '$245.21'})

</script>

<template>
  <div class="col-span-3 h-full flex flex-col gap-20">
    <div class="flex justify-between items-center w-full">
      <h6 class="font-bold text-[#727476]">
        Analytics
      </h6>
      <div class="flex items-center text-caption gap-10 font-bold text-border">
        <button 
          :class="selectedTimeframe === '1y'? 'text-black font-extrabold' :'hover:text-grey_8'"
          @click="selectedTimeframe = '1y'"
        >
          1y
        </button>
        <button 
          :class="selectedTimeframe === '6m'? 'text-black font-extrabold' :'hover:text-grey_8'"
          @click="selectedTimeframe = '6m'"
        >
          6m
        </button>
        <button 
          :class="selectedTimeframe === '1m'? 'text-black font-extrabold' :'hover:text-grey_8'"
          @click="selectedTimeframe = '1m'"
        >
          1m
        </button>
        |
        <button 
          :class="selectedTimeframe === 'All Time'? 'text-black font-extrabold' :'hover:text-grey_8'"
          @click="selectedTimeframe = 'All Time'"
        >
          All Time
        </button>
      </div>
    </div>
    <div
      class="w-full border border-border rounded-[5px] h-full px-20 py-10
    flex flex-col gap-20"
    >
      <div class="flex justify-between items-center">
        <div class="flex items-center text-caption gap-5 font-bold text-border">
          <button 
            :class="selectedNetMetric === 'Net Value'? 'text-black font-extrabold' :'hover:text-grey_8'"
            @click="selectedNetMetric = 'Net Value'"
          >
            Net Value
          </button> |
          <button 
            :class="selectedNetMetric === 'Net Volume'? 'text-black font-extrabold' :'hover:text-grey_8'"
            @click="selectedNetMetric = 'Net Volume'"
          >
            Net Volume
          </button>
        </div>
        <div 
          class="text-grey_3 border border-border rounded-[5px]
           px-10 py-4 w-[100px] relative hover:border-grey_4"
          @mouseenter="openFilters = true"
          @mouseleave="openFilters = false"
        >
          <div class="text-caption font-bold flex items-center justify-between text-grey w-full">
            <div>
              Filter
            </div>
            <i
              :class="!openFilters ? 'iconoir-nav-arrow-down text-[10px]' : 'iconoir-nav-arrow-up text-[10px]'"
            />
          </div>
          <div
            v-show="openFilters"
            class="absolute right-0 top-[100% - 2px] bg-white h-2 w-[98px] z-[2]"
          />
          <div
            v-show="openFilters"
            class="absolute top-[100% - 1px] right-[-1px] w-[200px] border text-grey_3 border-border rounded-b-[5px] rounded-l-[5px]
            hover:border-grey_4 bg-white expand_height"
          >
            <div 
              class="w-full h-full flex justify-between p-10"
              :class="openFilters? 'delay_show opacity-[1]' : 'opacity-0'"
            >
              <div class="w-full border-r border-r-border">
                <span class="font-bold text-border text-body pr-10">
                  Net Value
                </span>
                <hr class="mr-10"> 
                <div class="text-body font-medium flex gap-5 items-center my-5">
                  <input
                    id="all"
                    v-model="net_value_filter"
                    type="radio"
                    value="all"
                  >
                  <label for="all"> All Assets</label>
                </div>
                <div class="text-body font-medium flex gap-5 items-center my-5">
                  <input
                    id="eth"
                    v-model="net_value_filter"
                    type="radio"
                    value="eth"
                  >
                  <label for="eth"> ETH</label>
                </div>
              </div>
              <div class="w-full  pl-10">
                <span class="font-bold text-border text-body">
                  Net Volume
                </span>
                <hr class=""> 
                <div class="text-body font-medium flex gap-5 items-center my-5">
                  <input
                    id="all"
                    v-model="net_volume_filter"
                    type="radio"
                    value="all"
                  >
                  <label for="all"> All Assets</label>
                </div>
                <div class="text-body font-medium flex gap-5 items-center my-5">
                  <input
                    id="wallets"
                    v-model="net_volume_filter"
                    type="radio"
                    value="wallets"
                  >
                  <label for="wallets"> In Wallets</label>
                </div>
                <div class="text-body font-medium flex gap-5 items-center my-5">
                  <input
                    id="staked"
                    v-model="net_volume_filter"
                    type="radio"
                    value="staked"
                  >
                  <label for="staked"> Staked</label>
                </div>
                <div class="text-body font-medium flex gap-5 items-center my-5">
                  <input
                    id="claimable"
                    v-model="net_volume_filter"
                    type="radio"
                    value="claimable"
                  >
                  <label for="claimable"> Claimable</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="h-full w-full">
        <LineChartJS 
          :id="'user_dash_linechart'"
          :x-grid-lines="false"
          :y-grid-lines="true"
        />
      </div>
    </div>
    <div 
      class="w-full border border-border rounded-[5px] px-20 py-10 h-[140px]
    flex justify-between items-center"
    >
      <div class="w-2/6 h-full flex flex-col justify-between pr-10">
        <div class="mb-10 flex justify-between items-center w-full pt-10">
          <span class="text-caption font-bold text-border">
            ROI
          </span>
          <!-- No need for expandalbe modal atm -->
          <!-- <button class="iconoir-expand text-blue_3 hover:text-primary text-body" /> -->
        </div>
        <div class="w-full text-right pb-5">
          <h5 
            class="font-bold"
            :class="roi_metric > 0? ' text-approve' : 'text-decline'"
          >
            {{ roi_metric }} %
          </h5>
        </div>
      </div>
      <div class="w-1 bg-border h-full" />
      <div class="w-4/6 h-full flex flex-col justify-between px-10">
        <div class="flex justify-between items-center w-full pt-10 mb-20">
          <span class="text-caption font-bold text-border">
            All Time Net Values
          </span>
          <!-- No need for expandalbe modal atm -->
          <!-- <button class="iconoir-expand text-blue_3 hover:text-primary text-body" /> -->
        </div>
        <div class="w-full flex justify-between items-center pb-5">
          <div class="text-left">
            <span class="text-caption font-bold text-grey_2">
              {{ allTimeLow.date }}
            </span>
            <h5 
              class="font-bold text-decline"
            >
              {{ allTimeLow.value }}
            </h5>
          </div>
          <div class="text-right">
            <span class="text-caption font-bold text-grey_2">
              {{ allTimeHigh.date }}
            </span>
            <h5
              class="font-bold text-approve"
            >
              {{ allTimeHigh.value }}
            </h5>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>