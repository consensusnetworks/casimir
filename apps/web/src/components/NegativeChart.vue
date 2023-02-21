<script setup>
import LineChart from '@/components/charts/LineChart.vue'
import * as d3 from 'd3'

// eslint-disable-next-line no-undef, @typescript-eslint/no-unused-vars
const props = defineProps({
    chartId: {
        type: String,
        required: true
    },
})

import { ref } from 'vue'
const parseTime = d3.timeParse('%d/%m/%Y')
const lineChartData = 
  [
    {
      date: 0,
      price: 3
    },
    {
      date: 1,
      price: 1.5
    },
    {
      date: 2,
      price: 2
    },
    {
      date: 3,
      price: 0
    },
  ]

const xAxisFormat = (d) => {
  return d
}
const yAxisFormat = (x) => {
    return x
}


</script>

<template>
  <div class="w-full h-full">
    <LineChart 
      :data="lineChartData"
      :y-axis-value="'price'"
      :x-axis-value="'date'"
      :x-axis-format="xAxisFormat"
      :y-axis-format="yAxisFormat"
      :line-color="'#DF3A3A'"
      :chart-id="props.chartId"
    />
  </div>
</template>

<style scoped>

</style>