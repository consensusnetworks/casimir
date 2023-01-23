<script setup>
import { onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'

// eslint-disable-next-line no-undef, @typescript-eslint/no-unused-vars
const props = defineProps({
    data: {
        type: Array,
        required: true
    },
    updateTooltipInfo: {
        type: Function,
        default: (e) => {
            // console.log(e)
        }
    },
    yAxisValue: {
        type: String, 
        required: true
    },
    xAxisValue: {
        type: String, 
        required: true
    },
    xAxisFormate: {
        type: Function,
        required: true
    },
    yAxisFormate: {
        type: Function,
        required: true
    },
    // TD: for later versions create chart brushes and different tooltip styles
})

onMounted(() => {
    let WIDTH = 0
    let HEIGHT =  0
    const svg_container_el = document.getElementById('line_chart_container')

    let svg
    let g
    let x 
    let y

    // Break points to show-hide axies
    const width_breaking_point_small = 300
    const height_breaking_point_small = 200

    const width_breaking_point_medium = 500
    const height_breaking_point_medium = 200

    // for line tooltip
    const bisectDate = d3.bisector(d => d[props.xAxisValue]).left


    let xAxisCall
    let xAxis

    
    let yAxisCall
    let yAxis

    

    const updateChart = () => {

        // Makes sure the axis are correct based on breakpoints
        let xAxisRange = [0,(WIDTH - 30)]
        let yAxisRange = [HEIGHT, 20]
        if(WIDTH <= 150 ){
            xAxisRange = [0, WIDTH]
        } else if (HEIGHT <= height_breaking_point_small) {
            xAxisRange = [0, WIDTH]
        }

        if(HEIGHT <= 150 ){
            yAxisRange = [HEIGHT, 0]
        } else if (WIDTH <= width_breaking_point_small) {
            yAxisRange = [HEIGHT, 0]
        }


        x = d3.scaleTime().range(xAxisRange)
        y = d3.scaleLinear().range(yAxisRange)


        // dynamic x axis labeling based on width
        if(WIDTH <= width_breaking_point_medium){
            xAxisCall = d3.axisBottom()
                .tickFormat((d, i) => {
                    if(i %2 === 0){
                       return props.xAxisFormate(d)
                    } else {
                        return ''
                    }
                })
        }else {
            xAxisCall = d3.axisBottom()
                .tickFormat(d => {
                    return props.xAxisFormate(d)
                })
        }
        
        yAxisCall = d3.axisLeft()

        xAxis = g.append('g')
            .attr('class', 'x axis')
            .attr('transform', `translate(0, ${HEIGHT})`)
        yAxis = g.append('g')
            .attr('class', 'y axis')

        
        
        const update = (data) => {

            // Updates tooltip based on data on start
            const lastDValue = d3.max(data, d => {
                return d[props.yAxisValue]
            })
            props.updateTooltipInfo(lastDValue)
            // 

            const yValue = props.yAxisValue

            // 1.005 is just for adding a little bit of spacing for the y domain 
            x.domain(d3.extent(data, d => d[props.xAxisValue]))
            y.domain([
                d3.min(data, d => d[yValue]) / 1.005, 
                d3.max(data, d => d[yValue]) * 1.005
            ])

            xAxisCall.scale(x)
            xAxis.transition(d3.transition().duration(500))
                .call(xAxisCall)

            yAxisCall.scale(y)
            yAxis.transition(d3.transition().duration(500))
                .call(yAxisCall.tickFormat(d => props.yAxisFormate(d)))
            d3.select('.focus').remove()
            d3.select('.overlay').remove()

            const focus = g.append('g')
                .attr('class', 'focus')
                .style('display', 'none')

            focus.append('line')
                .attr('class', 'x-hover-line hover-line')
                .attr('y1', 0)
                .attr('y2', HEIGHT)

            // focus.append("line")
            //     .attr("class", "y-hover-line hover-line")
            //     .attr("x1", 0)
            //     .attr("x2", WIDTH)

            focus.append('circle')
                .attr('r', 2.5)
                .attr('fill', '#0D5FFF')

            focus.append('text')
                .attr('x', 15)
                .attr('dy', '.31em')
                .attr('fill', '#0D5FFF')

            g.append('rect')
                .attr('class', 'overlay')
                .attr('width', WIDTH)
                .attr('height', HEIGHT)
                .attr('fill', '#0D5FFF')
                .on('mouseover', () => focus.style('display', null))
                .on('mouseout', () => {
                    focus.style('display', 'none')
                    const lastDValue = d3.max(data, d => {
                        return d[props.yAxisValue]
                    })
                    props.updateTooltipInfo(lastDValue)
                })
                .on('mousemove', mousemove)

            function mousemove(e) {
                const x0 = x.invert(d3.pointer(e)[0])
                const i = bisectDate(data, x0, 1)
                const d0 = data[i - 1]
                const d1 = data[i]
                const d = x0 - d0[props.xAxisValue] > d1[props.xAxisValue] - x0 ? d1 : d0
                focus.attr('transform', `translate(${x(d[props.xAxisValue])}, ${y(d[yValue])})`)
                // focus.select("text").text(d[yValue])
                // viewingValue.value = d[yValue]
                // viewingValuePercentage.value = Math.floor(Math.random() * (15 - (-15) + 1) + (-15))
                props.updateTooltipInfo(d[yValue])
                focus.select('.x-hover-line').attr('y2', HEIGHT - y(d[yValue]))
                focus.select('.y-hover-line').attr('x2', -x(d[props.xAxisValue]))
            }

            const line = d3.line()
            .x(d => x(d[props.xAxisValue]))
            .y(d => y(d[yValue]))

            // let t =  
            g.select('.line')
            .transition(d3.transition().duration(500))
            .attr('d', line(data))
        }

        watch(props, () => {
            update(props.data)
        })
        if(props.data){
            update(props.data)
        }
        
    }

    const createViz = () => {
        d3.select('svg').remove()

        svg = d3.select('#line_chart').append('svg')
        .attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`)

        // shows axis labels if chart not <= small breaking point
        // 150 being too small to show any labels
        let xTransiton = 30
        let yTransition = -20
        if(WIDTH <= 150 ){
            xTransiton = 0
        } else if (HEIGHT <= height_breaking_point_small) {
            xTransiton = 0
        }

        if(HEIGHT <= 150 ){
            yTransition = 0
        } else if (WIDTH <= width_breaking_point_small) {
            yTransition = 0
        }

        g = svg.append('g')
            .attr('transform', `translate(${
                xTransiton // hotizontal 
            }, ${
                yTransition // vertical
            })`)
        


        g.append('path')
            .attr('class', 'line')
            .attr('width', WIDTH )
            .attr('height', HEIGHT )

        updateChart()
    }


    WIDTH = svg_container_el.offsetWidth
    HEIGHT = svg_container_el.offsetHeight

    
    // watches for size changes... 
    function outputsize() {
        WIDTH = svg_container_el.offsetWidth
        HEIGHT = svg_container_el.offsetHeight
        createViz()
    }
    outputsize()
    new ResizeObserver(outputsize).observe(svg_container_el)   

    createViz()
})

</script>

<template>
  <div
    id="line_chart_container"
    class="w-full h-full text-center align-middle"
  >
    <div
      id="line_chart"
      class="block m-auto h-full w-full"
    />
  </div>
</template>

<style scoped>

</style>