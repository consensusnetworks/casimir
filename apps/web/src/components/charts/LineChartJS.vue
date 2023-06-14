<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import Chart, { ChartItem } from 'chart.js/auto'

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
    }
})

const chart = ref(null as any)
onMounted(() => {
    // TD: make this gradient dynamic with the data and it's colors
    var ctx = document.getElementById(props.id)?.getContext('2d')
    var gradient = ctx? ctx.createLinearGradient(0, 0, 0, 400): 'black'
        gradient.addColorStop(0, 'rgba(86, 138, 217,0.28)')   
        gradient.addColorStop(1, 'rgba(86, 138, 217,0)') 
    chart.value = new Chart(document.getElementById(props.id) as ChartItem , {
        type : 'line',
		data : {
			labels : [ 'Jan 22', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug',
             'Sep', 'Oct', 'Nov', 'Dec', 'Jan 23', 'Feb', 'Mar' ],
			datasets : [
                {
                    data : Array.from({length: 15}, () => Math.floor(Math.random() * (250 - 200 + 1) + 200)),
                    label : 'Primary Account',
                    borderColor : '#2F80ED',
                    fill: true,
                    backgroundColor: gradient,
                    pointRadius: 0,
                    tension: 0.1
                },
                {
                    data : Array.from({length: 15}, () => Math.floor(Math.random() * (150 - 100 + 1) + 100)),
                    label : '-',
                    borderColor : '#A8C8F3',
                    fill: false,
                    // backgroundColor: gradient,
                    pointRadius: 0,
                    tension: 0.1
                },
                {
                    data : Array.from({length: 15}, () => Math.floor(Math.random() * (50 - 0 + 1) + 50)),
                    label : '-',
                    borderColor : '#53389E',
                    fill: false,
                    // backgroundColor: gradient,
                    pointRadius: 0,
                    tension: 0.1
                }
            ]
		},
		options : {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: props.legend,
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
                }
            }
		}
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
        chart.value.resize(WIDTH -20 , HEIGHT)
    }
    if(line_chart_container_el){
        new ResizeObserver(outputsize).observe(line_chart_container_el)   
    }
})
</script>

<template>
  <div 
    class="h-full w-full"
  >
    <canvas
      :id="props.id"
    />
  </div>
</template>