<script setup>

import { onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'

import LineChart from '@/components/charts/LineChart.vue'
import PieChart from '@/components/charts/PieChart.vue'

const selectedData = ref('bitcoin')

const dataTimeFilteredV = ref()
const data = ref('')
const yAxisValue = ref('price_usd')
const xAxisValue = ref('date')

const updateData = () => {
  d3.json('src/pages/chart-test/coins.json').then(data => {
    const parseTime = d3.timeParse('%d/%m/%Y')
    let filteredData = {}
    Object.keys(data).forEach(coin => {
        filteredData[coin] = data[coin]
            .filter(d => {
                return !(d['price_usd'] == null)
            }).map(d => {
                d['price_usd'] = Number(d['price_usd'])
                d['24h_vol'] = Number(d['24h_vol'])
                d['market_cap'] = Number(d['market_cap'])
                d['date'] = parseTime(d['date'])
                return d
            })
    })

    dataTimeFilteredV.value = filteredData[selectedData.value].filter(d => {
        return d
    })
  })  
}

const updateTooltipInfo = (e) => {
  data.value = e
}

onMounted(()=> {
  updateData()
})

watch(selectedData, ()=> {
  updateData()
})

const xAxisFormate = (d) => {
  const label = new Date(d).toDateString().split(' ')
  if(label[1] === 'Jan'){
      return label[3]
  } else {
      return label[1]
  }
}

const formatSi = d3.format('.2s')
const yAxisFormate = (x) => {
    const s = formatSi(x)
    switch (s[s.length - 1]) {
        case ' G ': return s.slice(0, -1) + ' B ' // billions
        case ' k ': return s.slice(0, -1) + ' K ' // thousands
    }
    return s
}

</script>

<template>
  <div class="h-full w-full grid grid-cols-2">
    <div class="col-span-2 flex justify-between items-center">
      <button 
        class="btn_primary"
        @click="selectedData === 'bitcoin'? selectedData = 'ethereum': selectedData = 'bitcoin'"
      >
        Toggle Data
      </button>
      <div>
        {{ data }}
      </div>
    </div>
    <div class="text-center col-span-2 flex items-center justify-center">
      <div class="h-[80%] w-[80%]">
        <LineChart 
          :data="dataTimeFilteredV"
          :update-tooltip-info="updateTooltipInfo"
          :y-axis-value="yAxisValue"
          :x-axis-value="xAxisValue"
          :x-axis-formate="xAxisFormate"
          :y-axis-formate="yAxisFormate"
        />
      </div>
    </div>
    <!-- <div class="text-center border">
      <PieChart />
    </div> -->
  </div>
</template>

<style scoped>

</style>