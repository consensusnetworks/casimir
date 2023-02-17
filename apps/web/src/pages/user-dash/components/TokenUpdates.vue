<script lang="ts" setup>
import PositiveChart from '@/components/PositiveChart.vue'
import NegativeChart from '@/components/NegativeChart.vue'

</script>
  
<template>
  <div class="flex flex-col gap-10 overflow-auto">
    <h6 class="font-medium text-grey_8 mb-10">
      Token Updates
    </h6>
    <div class="w-full py-12 px-10 border border-grey_2 flex justify-between gap-15 items-center">
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
        <div class="h-full w-[50px] not-sr-only dash_mid:sr-only">
          <PositiveChart :chart-id="'BTC_chart'" />
        </div>
        <div class="text-body font-bold text-[#36B159] whitespace-nowrap">
          +2.3 %
        </div>
      </div>
    </div>
    <div class="w-full py-12 px-10 border border-grey_2 flex justify-between gap-15 items-center">
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
        <div class="h-full w-[50px] not-sr-only dash_mid:sr-only">
          <NegativeChart :chart-id="'SOL_chart'" />
        </div>
        <div class="text-body font-bold text-[#DF3A3A] whitespace-nowrap">
          +2.3 %
        </div>
      </div>
    </div>
    <div class="w-full py-12 px-10 border border-grey_2 flex justify-between gap-15 items-center">
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
        <div class="h-full w-[50px] not-sr-only dash_mid:sr-only">
          <PositiveChart :chart-id="'IOTEX_chart'" />
        </div>
        <div class="text-body font-bold text-[#36B159] whitespace-nowrap">
          +2.3 %
        </div>
      </div>
    </div>
    <div class="w-full py-12 px-10 border border-grey_2 flex justify-between gap-15 items-center">
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
        <div class="h-full w-[50px] not-sr-only dash_mid:sr-only">
          <NegativeChart :chart-id="'ETH_chart'" />
        </div>
        <div class="text-body font-bold text-[#DF3A3A] whitespace-nowrap">
          +2.3 %
        </div>
      </div>
    </div>
  </div>
</template>