<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue'
import Chart, { ChartItem, ChartData } from 'chart.js/auto'

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
    gradient: {
        type: Boolean,
        default: false
    }
})

const hexToRGB = (hex: string) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0}
}
let ctx: any
let line_chart: Chart<any, any[], unknown>
onMounted(() => {
    ctx = document.getElementById(props.id)?.getContext('2d')
    line_chart = new Chart(ctx, {
        type : 'line',
		data : props.data as ChartData<any>,
		options : {
            responsive: true,
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
})

watch(props, (newVal, oldVal)=> {
    if(line_chart.data !== props.data){
        line_chart.data = props.data

        if(props.gradient){
            
            for (let i = 0; i < line_chart.data.datasets.length; i++) {
                if(line_chart.data.datasets[i].backgroundColor){
                    let gradient = ctx? ctx.createLinearGradient(0, 0, 0, 400): 'black'
                    let rgb = hexToRGB(line_chart.data.datasets[i].backgroundColor)
                    console.log(rgb)
                    gradient.addColorStop(0, `rgba(${rgb?.r},${rgb?.g},${rgb?.b}, 0.28)`) 
                    gradient.addColorStop(1, 'rgba(0, 0, 0,0)') 

                    line_chart.data.datasets[i].backgroundColor = gradient
                }
            }
        }

        line_chart.update()
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