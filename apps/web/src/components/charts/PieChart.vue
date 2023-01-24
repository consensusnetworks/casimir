<script setup>
import { onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'


// eslint-disable-next-line no-undef, @typescript-eslint/no-unused-vars
const props = defineProps({
    data: {
      type: Array,
      required: true
    },
    legend: {
      type: Boolean,
      required: true
    },
    colors: {
      type: Object, 
      required: true
    }
    // TD: for future versions add tooltip cards / ticks
})

const showLegend = ref(props.legend)

onMounted(() => {
  // d3.selectAll('#pie_chart').select('svg').remove()
  console.log(d3.selectAll('#pie_chart').selectAll('svg').remove())

  const svg_pie_chart_container_el = document.getElementById('pie_chart_conatiner')

  let width = 0
  let height = 0
  let radius = Math.min(width, height) / 2

  let pie_chart_svg

  const createViz = () => {

    var arc = d3.arc()
      .outerRadius(radius - 20)
      .innerRadius(radius - 80)

    var pie = d3.pie()
      .sort(null)
      .value(function(d) { return d.value })

    if(!pie_chart_svg){
      pie_chart_svg = d3.select('#pie_chart').append('svg')
        .attr('transform', 'translate(0,0)')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
    }else {
      d3.select('#pie_chart').select('svg')
        .attr('transform', 'translate(0,0)')
        .attr('width', width)
        .attr('height', height)
      d3.select('#pie_chart').select('svg').select('g')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')') 
    }
    

    pie_chart_svg.selectAll('.arc')
      .data(pie(props.data))
      .enter().append('g')
      .attr('class', 'arc')

    function arcTween(d) {
      var i = d3.interpolate(this._current, d)
      this._current = i(1)
      return function(t) { return arc(i(t)) }
    }

    const updateChart = () => {
      var path = pie_chart_svg.selectAll('path')

      path = path.data(pie(props.data))

      // EXIT old elements from the screen.
      path.exit()
        .transition()
        .duration(100)
        .attrTween('d', arcTween)
        .remove()
      
        // UPDATE elements still on the screen.
      path.transition()
        .duration(500)
        .attrTween('d', arcTween)
      
        // ENTER new elements in the array.
      path.enter()
        .append('path')
        .attr('fill', function(d) {  return props.colors[d.data.asset] })
        .transition()
        .duration(1000)
            .attrTween('d', arcTween)
    }

    updateChart()

    watch([props], ()=> {
      updateChart()
    })

    watch(props, ()=> {
      if(width <= 300 || height <= 300) {
        showLegend.value = false
      } else if(props.legend){
        showLegend.value = true
      }
    })
  }

  // watches for size changes... 
  function outputsize() {
    width = svg_pie_chart_container_el.offsetWidth
    height = svg_pie_chart_container_el.offsetHeight
    radius = Math.min(width, height) / 2
    if(width <= 300 || height <= 300) {
      showLegend.value = false
    } else if(props.legend){
      showLegend.value = true
    }
    createViz()
  }
  outputsize()
  new ResizeObserver(outputsize).observe(svg_pie_chart_container_el)

  // Calls it on mounted without listening first
  createViz()
})
</script>

<template>
  <div class="h-full w-full">
    <div
      v-if="showLegend"
      class="w-full flex items-center justify-center flex-wrap gap-20 h-40"
    >
      <div
        v-for="item in data"
        :key="item.asset"
        class="text-body font-bold flex items-center gap-5"
      >
        <div
          class="h-16 w-16"
          :style="`background-color: ${props.colors[item.asset]}`"
        />
        {{ item.asset }}
      </div>
    </div>
    <div
      id="pie_chart_conatiner"
      class="w-full text-center align-middle"
      :style="showLegend? 'height: calc(100% - 40px)' : 'height:100%'"
    >
      <div
        id="pie_chart"
        class="block m-auto h-full w-full"
      />
    </div>
  </div>
</template>

<style scoped>

</style>