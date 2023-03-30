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
    chart.value = new Chart(document.getElementById(props.id) as ChartItem , {
        type : 'line',
		data : {
			labels : [ 'Jan 22', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug',
             'Sep', 'Oct', 'Nov', 'Dec', 'Jan 23', 'Feb', 'Mar' ],
			datasets : [
					{
						data : [ 186, 205, 1321, 1516, 2107, 5478, 186, 205,
								2191, 3133, 3221, 4783, 5478, 186, 205 ],
						label : 'Net Value',
						borderColor : '#C1D3F8',
                        fill: false,
                        tension: 0.4,
					}]
		},
		options : {
            responsive: true,
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
</script>

<template>
  <div>
    <canvas
      :id="props.id"
      class="w-full h-full"
    />
  </div>
</template>