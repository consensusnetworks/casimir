<script setup>
import LineChart from '@/components/charts/LineChart.vue'
import PieChart from '@/components/charts/PieChart.vue'
import * as d3 from 'd3'

import { ref } from 'vue'
const parseTime = d3.timeParse('%d/%m/%Y')
const lineChartData = 
  [
    {
      date: parseTime('01/01/22'),
      price: '01.25'
    },
    {
      date: parseTime('01/02/22'),
      price: '01.25'
    },
    {
      date: parseTime('01/03/22'),
      price: '01.25'
    },
    {
      date: parseTime('01/04/22'),
      price: '01.25'
    },
    {
      date: parseTime('01/05/22'),
      price: '01.25'
    },
    {
      date: parseTime('01/06/22'),
      price: '01.25'
    },
    {
      date: parseTime('01/07/22'),
      price: '01.25'
    },
    {
      date: parseTime('01/08/22'),
      price: '01.25'
    },
    {
      date: parseTime('01/09/22'),
      price: '01.25'
    },
    {
      date: parseTime('01/10/22'),
      price: '01.25'
    }
  ]

const xAxisFormat = (d) => {
  const label = new Date(d).toDateString().split(' ')
  if(label[1] === 'Jan'){
      return label[3]
  } else {
      return label[1]
  }
}
const formatSi = d3.format('.2s')
const yAxisFormat = (x) => {
    const s = formatSi(x)
    switch (s[s.length - 1]) {
        case ' G ': return s.slice(0, -1) + ' B ' // billions
        case ' k ': return s.slice(0, -1) + ' K ' // thousands
    }
    return s
}

const pieChartData = [
  {
    asset: 'Metamask',
    value: 123456.45
  },
  {
    asset: 'Ledger',
    value: 123456.45
  },
  {
    asset: 'Coinbase',
    value: 123456.45
  },
]

const pieChartDataColors = {
  'Metamask': '#FBBD84',
  'Ledger': '#8c8c8c',
  'Coinbase': '#0D5FFF'
}

</script>

<template>
  <div class="flex items-center justify-between w-full h-full border p-20">
    <div class="w-[45%] h-[100%]">
      <LineChart 
        :data="lineChartData"
        :y-axis-value="'price'"
        :x-axis-value="'date'"
        :x-axis-format="xAxisFormat"
        :y-axis-format="yAxisFormat"
      />
    </div>
    <div class="w-[45%] h-[100%]">
      <PieChart 
        :data="pieChartData"
        :legend="true"
        :colors="pieChartDataColors"
      />
    </div>
  </div>
</template>

<style scoped>

</style>