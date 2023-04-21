<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import Chart, { ChartItem, ChartDataset, ChartData } from 'chart.js/auto'

// eslint-disable-next-line no-undef
const props = defineProps({
    id: {
        type: String,
        required: true,
    },
    legend: {
        type: Boolean,
        default: false
    },
    xGridLines: {
        type: Boolean,
        default: false
    },
    yGridLines: {
        type: Boolean,
        default: false
    },
    data: {
        type: Object,
        required: true
    },
})

const chart = ref(null as any)

const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: props.legend,
        },
        tooltip: {
            callbacks: {
                footer: (e) => {
                    // console.log(e)
                    return '$ ' +  e[0].raw + ' / ETH 0.00'// ADD convertion to Curreny here
                },
            }
        }
    },
    interaction: {
        intersect: false,
    },
    scales: {
        x: {
            border: {
                display: true,
                color: '#BFBFBF'
            },
            grid: {
                display: props.xGridLines,
                drawTicks: true,
                color: '#F2F2F2'
            }
        },
        y: {
            border: {
                display: true,
                color: '#BFBFBF'
            },
            grid: {
                display: props.yGridLines,
                drawTicks: true,
                color: '#F2F2F2'
            },
            ticks: {
            // Include a dollar sign in the ticks
                callback: function(value, index, ticks) {
                    const formatOptions = [
                        { value: 1, symbol: '' },
                        { value: 1e3, symbol: 'k' },
                        { value: 1e6, symbol: 'M' },
                        { value: 1e9, symbol: 'G' },
                        { value: 1e12, symbol: 'T' },
                        { value: 1e15, symbol: 'P' },
                        { value: 1e18, symbol: 'E' }
                    ]
                    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/
                    var item = formatOptions.slice().reverse().find(function(item) {
                        return Number(value) >= item.value
                    })
                    return item ? (Number(value) / item.value).toFixed(2).replace(rx, '$1') + item.symbol : '0'
                }
            }
        }
    }
}

const createChart = () => {
    if(reloading.value){
        chart.value = new Chart(document.getElementById(props.id) as ChartItem , {
            type : 'line',
            data : props.data as ChartData,
            options : options
        })

        const line_chart_container_el = document.getElementById('line_chart_container_' + props.id)
        let WIDTH = 0
        let HEIGHT =  0

        // watches for size changes... 
        const outputsize = () => {
            if(line_chart_container_el){
                WIDTH = line_chart_container_el.offsetWidth
                HEIGHT = line_chart_container_el.offsetHeight
            }
            chart.value.resize(WIDTH -20 , HEIGHT - 50)
        }
        if(line_chart_container_el){
            new ResizeObserver(outputsize).observe(line_chart_container_el)   
        }
        setTimeout(() => {
            reloading.value = false
        }, 1000)
    }
    
}

const destroyChart = () => {
    reloading.value = true
    if(chart.value) chart.value.destroy()
}
onMounted(() => {
    reloading.value = true
    createChart()
})

const reloading = ref(false)
watch(props, () => {
    // Need this 1 sec buffor due to Chart loading on change of prop take about a sec to load and quick changes throw errors on quick change. 
    if(!reloading.value){
        destroyChart()
        createChart() 
    } else  (
        setTimeout(() => {
            destroyChart()
            createChart() 
        },1100)
    )
})
</script>

<template>
  <div 
    class="flex items-center justify-center"
  >
    <canvas
      :id="props.id"
    />
  </div>
</template>