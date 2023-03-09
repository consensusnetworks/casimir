<script lang="ts" setup>
import { onMounted, ref, onUnmounted } from 'vue'
import PositiveChart from '@/components/PositiveChart.vue'
import NegativeChart from '@/components/NegativeChart.vue'
import useExternal from '@/composables/external'
import { Currency } from '@casimir/types'
import * as d3 from 'd3'

const {
    getConversionRate
} = useExternal()

const convertToUSD = async (currency: Currency, date: string) => {
    const conversion = await getConversionRate(currency, 'USD', date)
    return conversion 
}

const BTC = ref({
  currentPrice: '0',
  linechartOrientaion: '+',
  changePercentage: '0'
})

const SOL = ref({
  currentPrice: '0',
  linechartOrientaion: '+',
  changePercentage: '0'
})

const IOTX = ref({
  currentPrice: '0',
  linechartOrientaion: '+',
  changePercentage: '0'
})

const ETH = ref({
  currentPrice: '0',
  linechartOrientaion: '+',
  changePercentage: '0'
})

// eslint-disable-next-line no-undef
let interval: string|number|NodeJS.Timeout
onMounted(()=> {
  setInterval(async ()=> {
    let formatter = d3.format('.2f')
    let today = new Date() as any
    let yesterday = new Date(new Date().setDate(today.getDate() - 1))  as any
    today = today.getFullYear()+'-'+(today.getMonth() + 1)+'-'+today.getDay()
    yesterday = yesterday.getFullYear()+'-'+(yesterday.getMonth() + 1)+'-'+yesterday.getDay()

    BTC.value = {
      currentPrice: await convertToUSD('BTC', today),
      linechartOrientaion: await convertToUSD('BTC', today)/await convertToUSD('BTC', yesterday) < 0? '+' : '-',
      changePercentage: formatter(100 - (await convertToUSD('BTC', today)/await convertToUSD('BTC', yesterday) *100) )
    }
    SOL.value = {
      currentPrice: await convertToUSD('SOL', today),
      linechartOrientaion: await convertToUSD('SOL', today)/await convertToUSD('SOL', yesterday) < 0? '+' : '-',
      changePercentage: formatter(100 - (await convertToUSD('SOL', today)/await convertToUSD('SOL', yesterday) *100) )
    }
    IOTX.value = {
      currentPrice: await convertToUSD('IOTX', today),
      linechartOrientaion: await convertToUSD('IOTX', today)/await convertToUSD('IOTX', yesterday) < 0? '+' : '-',
      changePercentage: formatter(100 - (await convertToUSD('IOTX', today)/await convertToUSD('IOTX', yesterday) *100) )
    }
    ETH.value = {
      currentPrice: await convertToUSD('ETH', today),
      linechartOrientaion: await convertToUSD('ETH', today)/await convertToUSD('ETH', yesterday) < 0? '+' : '-',
      changePercentage: formatter(100 - (await convertToUSD('ETH', today)/await convertToUSD('ETH', yesterday) *100) )
    }
  }, 2000)
})

onUnmounted(()=>{clearInterval(interval)})

</script>
  
<template>
  <div class="flex flex-col gap-10 overflow-auto">
    <h6 class="font-bold text-body text-grey_5 mb-10">
      Currency Updates
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
            ${{ BTC.currentPrice }}
          </span>
        </div>
      </div>
            
      <div class="flex items-center gap-10 h-full">
        <div class="h-full w-[50px] not-sr-only dash_mid:sr-only">
          <PositiveChart
            v-if="BTC.linechartOrientaion === '+'"
            :chart-id="'BTC_chart'"
          />
          <NegativeChart
            v-else
            :chart-id="'BTC_chart'"
          />
        </div>
        <div
          class="text-body font-bold text-[#36B159] whitespace-nowrap"
          :class="BTC.linechartOrientaion === '+'? 'text-[#36B159]':'text-[#DF3A3A]'"
        >
          {{ BTC.linechartOrientaion }} {{ BTC.changePercentage }} %
        </div>
      </div>
    </div>
    <div class="w-full py-12 px-10 border border-grey_2 flex justify-between gap-15 items-center">
      <div class="flex gap-10 items-center h-full">
        <img
          src="/ETH.svg"
          alt="Bitcoin Icon"
          class="h-30 w-30"
        >
        <div class="flex flex-col">
          <span class="font-medium text-body text-grey_5">
            ETH
          </span>
          <span class="text-caption text-grey_4">
            ${{ ETH.currentPrice }}
          </span>
        </div>
      </div>
            
      <div class="flex items-center gap-10 h-full">
        <div class="h-full w-[50px] not-sr-only dash_mid:sr-only">
          <PositiveChart
            v-if="ETH.linechartOrientaion === '+'"
            :chart-id="'ETH_chart'"
          />
          <NegativeChart
            v-else
            :chart-id="'ETH_chart'"
          />
        </div>
        <div
          class="text-body font-bold text-[#36B159] whitespace-nowrap"
          :class="ETH.linechartOrientaion === '+'? 'text-[#36B159]':'text-[#DF3A3A]'"
        >
          {{ ETH.linechartOrientaion }} {{ ETH.changePercentage }} %
        </div>
      </div>
    </div>
    <div class="w-full py-12 px-10 border border-grey_2 flex justify-between gap-15 items-center">
      <div class="flex gap-10 items-center h-full">
        <img
          src="/IOTX.svg"
          alt="Bitcoin Icon"
          class="h-30 w-30"
        >
        <div class="flex flex-col">
          <span class="font-medium text-body text-grey_5">
            IOTX
          </span>
          <span class="text-caption text-grey_4">
            ${{ IOTX.currentPrice }}
          </span>
        </div>
      </div>
            
      <div class="flex items-center gap-10 h-full">
        <div class="h-full w-[50px] not-sr-only dash_mid:sr-only">
          <PositiveChart
            v-if="IOTX.linechartOrientaion === '+'"
            :chart-id="'IOTX_chart'"
          />
          <NegativeChart
            v-else
            :chart-id="'IOTX_chart'"
          />
        </div>
        <div
          class="text-body font-bold text-[#36B159] whitespace-nowrap"
          :class="IOTX.linechartOrientaion === '+'? 'text-[#36B159]':'text-[#DF3A3A]'"
        >
          {{ IOTX.linechartOrientaion }} {{ IOTX.changePercentage }} %
        </div>
      </div>
    </div>
    <div class="w-full py-12 px-10 border border-grey_2 flex justify-between gap-15 items-center">
      <div class="flex gap-10 items-center h-full">
        <img
          src="/solana.svg"
          alt="Bitcoin Icon"
          class="h-30 w-30"
        >
        <div class="flex flex-col">
          <span class="font-medium text-body text-grey_5">
            SOL
          </span>
          <span class="text-caption text-grey_4">
            ${{ SOL.currentPrice }}
          </span>
        </div>
      </div>
            
      <div class="flex items-center gap-10 h-full">
        <div class="h-full w-[50px] not-sr-only dash_mid:sr-only">
          <PositiveChart
            v-if="SOL.linechartOrientaion === '+'"
            :chart-id="'SOL_chart'"
          />
          <NegativeChart
            v-else
            :chart-id="'SOL_chart'"
          />
        </div>
        <div
          class="text-body font-bold text-[#36B159] whitespace-nowrap"
          :class="SOL.linechartOrientaion === '+'? 'text-[#36B159]':'text-[#DF3A3A]'"
        >
          {{ SOL.linechartOrientaion }} {{ SOL.changePercentage }} %
        </div>
      </div>
    </div>
  </div>
</template>