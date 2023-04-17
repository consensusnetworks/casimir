<script lang="ts" setup>
import { ref } from 'vue'
import LineChartJS from '@/components/charts/LineChartJS.vue'

const roi_metric = ref(-4.2)

const selectedTimeFrame = ref('All Time')
const timeFrameOptions = ref(['All Time', '1 Year', '6 Month', '1 Month'])
const openTimeFrameOptions = ref(false)

const selectedWallet = ref('All Wallets')
// TD: Aggergate through wallets and add them to the options (by address or providors?)
const selectWalletOptions = ref(['All Wallets'])
const openWallletOptions = ref(false)

const selectedAssetLocation = ref(null as null | string)

</script>

<template>
  <div class="w-full h-full flex flex-col justify-between gap-20">
    <div class="flex justify-between items-center">
      <h6 class="font-bold text-[#727476]">
        Staking Analytics
      </h6>
    </div>
    <div
      class="h-full flex flex-col gap-0 items-center
      border border-border rounded-[5px] px-10 py-20"
    >
      <!-- TD: Make this clickable to adjust the line chart && make the size dynamic -->
      <div class="w-full flex gap-5 px-15 justify-between items-center whitespace-nowrap">
        <button
          class="w-2/6 text-left text-body text-grey_4
          hover:text-grey_6 min-w-[60px]"
          :class="selectedAssetLocation === 'In Wallets'? 
            'text-grey_6' :
            selectedAssetLocation === null? 
              'text-grey_4': 'text-grey_4 opacity-40 hover:opacity-100'
          "
          @click="selectedAssetLocation === 'In Wallets'?
            selectedAssetLocation = null :
            selectedAssetLocation = 'In Wallets'
          "
        >
          <div class="font-bold mb-5">
            In Wallets
          </div>
          <div class="w-full rounded-[5px] bg-blue_3 h-10" />
        </button>
        <button
          class="w-3/6 text-left text-body text-grey_4
          hover:text-grey_6 min-w-[50px]"
          :class="selectedAssetLocation === 'Staked'? 
            'text-grey_6' :
            selectedAssetLocation === null? 
              'text-grey_4': 'text-grey_4 opacity-40 hover:opacity-100'
          "
          @click="selectedAssetLocation === 'Staked'?
            selectedAssetLocation = null :
            selectedAssetLocation = 'Staked'
          "
        >
          <div class="font-bold mb-5">
            Staked
          </div>
          <div class="w-full rounded-[5px] bg-blue_4 h-10" />
        </button>
        <button
          class="w-1/6 text-left text-body
          hover:text-grey_6 min-w-[65px]"
          :class="selectedAssetLocation === 'Claimable'? 
            'text-grey_6' :
            selectedAssetLocation === null? 
              'text-grey_4': 'text-grey_4 opacity-40 hover:opacity-100'
          "
          @click="selectedAssetLocation === 'Claimable'?
            selectedAssetLocation = null :
            selectedAssetLocation = 'Claimable'
          "
        >
          <div class="font-bold mb-5">
            Claimable
          </div>
          <div class="w-full rounded-[5px] bg-blue_5 h-10" />
        </button>
      </div>

      <div
        :id="'line_chart_container_user_dash_linechart'" 
        class="w-full h-full flex justify-center"
      >
        <LineChartJS 
          :id="'user_dash_linechart'"
          :x-grid-lines="true"
          :y-grid-lines="false"
        />
      </div>

      <div class="w-full flex gap-5 px-15 justify-between items-center whitespace-nowrap">
        <h6
          class="font-bold text-grey_4"
        >
          <span 
            :class="roi_metric > 0? 
              ' text-approve' : 
              'text-decline'"
          >
            {{ roi_metric }} %
          </span>
          <span class="text-body font-bold ml-5">
            ROI
          </span>
        </h6>
        <div class="flex items-center gap-10">
          <div 
            class="text-grey_3 border border-grey_3
           px-10 py-4 w-[100px] relative hover:border-grey_4"
            :class="openWallletOptions? 'rounded-b-[5px]':'rounded-[5px]'"
            @mouseenter="openWallletOptions = true"
            @mouseleave="openWallletOptions = false"
          >
            <div class="text-caption font-bold flex items-center justify-between text-grey_3 w-full">
              <div>
                {{ selectedWallet }}
              </div>
              <i
                :class="!openWallletOptions ? 'iconoir-nav-arrow-down text-[10px]' : 'iconoir-nav-arrow-up text-[10px]'"
              />
            </div>
            <div
              v-show="openWallletOptions"
              class="absolute border text-grey_3 border-border rounded-t-[5px]
            hover:border-grey_4 bg-white expand_height"
              :style="
                `bottom: calc(100% - 1px);
                right: calc(-1px);
                width: calc(100% + 2px);`
              "
            >
              <div 
                class="w-full p-10 h-full flex flex-col gap-5"
                :class="openWallletOptions? 'delay_show opacity-[1]' : 'opacity-0'"
              >
                <button
                  v-for="option in selectWalletOptions"
                  :key="option"
                  class="w-full text-caption text-grey_3 text-left hover:text-grey_7"
                  @click="selectedWallet = option"
                >
                  {{ option }}
                </button>
              </div>
            </div>
          </div>
          <div 
            class="text-grey_3 border border-grey_3
           px-10 py-4 w-[100px] relative hover:border-grey_4"
            :class="openTimeFrameOptions? 'rounded-b-[5px]':'rounded-[5px]'"
            @mouseenter="openTimeFrameOptions = true"
            @mouseleave="openTimeFrameOptions = false"
          >
            <div class="text-caption font-bold flex items-center justify-between text-grey_3 w-full">
              <div>
                {{ selectedTimeFrame }}
              </div>
              <i
                :class="!openTimeFrameOptions ? 'iconoir-nav-arrow-down text-[10px]' : 'iconoir-nav-arrow-up text-[10px]'"
              />
            </div>
            <div
              v-show="openTimeFrameOptions"
              class="absolute border text-grey_3 border-border rounded-t-[5px]
            hover:border-grey_4 bg-white expand_height"
              :style="
                `bottom: calc(100% - 1px);
                right: calc(-1px);
                width: calc(100% + 2px);`
              "
            >
              <div 
                class="w-full p-10 h-full flex flex-col gap-5"
                :class="openTimeFrameOptions? 'delay_show opacity-[1]' : 'opacity-0'"
              >
                <button
                  v-for="option in timeFrameOptions"
                  :key="option"
                  class="w-full text-caption text-grey_3 text-left hover:text-grey_7"
                  @click="selectedTimeFrame = option"
                >
                  {{ option }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>