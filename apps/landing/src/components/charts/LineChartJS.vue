<script lang="ts" setup>
import { onMounted, watch } from 'vue'
import Chart, { ChartData } from 'chart.js/auto'

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
    },
    height: {
        type: Number,
        default: 400
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
    ctx = (document.getElementById(props.id) as HTMLCanvasElement).getContext('2d')
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

    try {
        const line_chart_container_el = document.getElementById('line_chart_container_' + props.id)
        let WIDTH = 0
        let HEIGHT =  0

        // watches for size changes... 
        const outputsize = () => {
            if(line_chart_container_el){
                WIDTH = line_chart_container_el.offsetWidth
                HEIGHT = line_chart_container_el.offsetHeight
            }
            line_chart.resize(WIDTH , HEIGHT )
        }
        if(line_chart_container_el){
            new ResizeObserver(outputsize).observe(line_chart_container_el)   
        }
    } catch (error) {
        console.log('Line Chart Resizing Error', error)
    }
    
})

watch(props, ()=> {
    if(line_chart.data !== props.data){
        line_chart.data = props.data as ChartData

        if(props.gradient){
            
            for (let i = 0; i < line_chart.data.datasets.length; i++) {
                if(line_chart.data.datasets[i].backgroundColor){
                    let gradient = ctx? ctx.createLinearGradient(0, 0, 0, 400): 'black'
                    let rgb = hexToRGB(line_chart.data.datasets[i].backgroundColor)

                    gradient.addColorStop(0, `rgba(${rgb?.r},${rgb?.g},${rgb?.b}, 0.28)`) 
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)') 

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
    class="w-full h-full"
  >
    <canvas
      :id="props.id"
    />
  </div>
</template>