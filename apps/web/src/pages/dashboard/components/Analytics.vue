<script lang="ts" setup>
import { ref } from 'vue'

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
  <div class="col-span-3 h-[450px] flex flex-col gap-20">
    <div class="flex justify-between items-center">
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

    <div class="w-full border border-border rounded-[5px] h-full px-20 py-10">
      <div class="h-full flex flex-col items-start justify-between gap-5">
        <div class="w-full h-50 flex justify-between items-center">
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
           px-10 py-8 w-[100px] relative hover:border-grey_4"
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
            /> <!--  Just a div to hide a border... css shinanigans -->
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
                  <div class="text-body font-medium flex gap-5 items-center my-5">
                    <input
                      id="other"
                      v-model="net_value_filter"
                      type="radio"
                      value="other"
                    >
                    <label for="other"> Other</label>
                  </div>
                </div>
                <div class="w-full border-l border-l-border pl-10">
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
        <div class="py-10 w-full flex justify-between items-center gap-5 border-t border-border">
          <div class="text-caption font-bold text-border w-1/6">
            Assets
            <div class="w-full bg-blue_2 h-12 rounded-[20px] mt-2" />
          </div>
          <div class="text-caption font-bold text-border  w-1/6">
            Stakings
            <div class="w-full bg-blue_3 h-12 rounded-[20px] mt-2" />
          </div>
          <div class="text-caption font-bold text-border  w-1/6">
            Stakings
            <div class="w-full bg-blue_3 h-12 rounded-[20px] mt-2" />
          </div>
          <div class="text-caption font-bold text-border  w-3/6">
            Other
            <div class="w-full bg-blue_4 h-12 rounded-[20px] mt-2" />
          </div>
        </div>
        <div class="h-full w-full border-b border-border">
          chart
        </div>
        <div class="w-full h-100 flex justify-between items-center gap-30">
          <div class="w-1/3 h-full p-5">
            <div class="mb-10">
              <span class="text-caption font-bold text-border">
                ROI
              </span>
            </div>
            <div class="w-full text-right align-bottom">
              <h6 
                class="font-bold"
                :class="roi_metric > 0? ' text-approve' : 'text-decline'"
              >
                {{ roi_metric }} %
              </h6>
            </div>
          </div>
          <div class="w-2 bg-border h-full" />
          <div class="w-2/3 h-full">
            <div class="mb-5">
              <span class="text-caption font-bold text-border">
                All Time
              </span>
            </div>
            <div class="w-full flex justify-between items-center">
              <div>
                <h6 
                  class="font-bold text-approve text-body"
                >
                  {{ allTimeHigh.value }}
                </h6>

                <span class="text-caption font-bold text-grey_3">
                  {{ allTimeHigh.date }}
                </span>
              </div>
              
              <div class="text-right">
                <h6 
                  class="font-bold text-decline text-body"
                >
                  {{ allTimeLow.value }}
                </h6>

                <span class="text-caption font-bold text-grey_3">
                  {{ allTimeLow.date }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>