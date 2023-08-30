<script lang="ts" setup>
import useRoadmap from '@/composables/roadmapItems'
import VueFeather from 'vue-feather'
import useScreenDimensions from '@/composables/screenDimensions'

const { screenWidth } = useScreenDimensions()

const { roadmapItems, casimirRoadmapLocation } = useRoadmap()
</script>

<template>
  <div class="my-[60px]">
    <div class="text-center my-[60px]">
      <span class="text-[14px] font-[600] text-primary">Roadmap</span>
      <h1 class="text-[36px] font-[600] mt-[20px] tracking-tight">
        The Steps Ahead
      </h1>
      <p class="text-[16px] font-[400] text-grey_4 tracking-tight">
        Navigating the Journey: Tracking Our Progress and Current Phase.
      </p>
    </div>

    <div class="w-full flex flex-col items-center justify-center px-[20%] 600s:px-[10%] gap-[10px]">
      <div
        v-for="(item, index) in roadmapItems"
        :key="index"
        class="flex flex-col items-center justify-center h-[200px] relative w-full"
        :class="index === 0? 'border-l' : index === roadmapItems.length - 1? 'border-r' : 'border-x'"
      >
        <div
          class="rounded-[999px] w-[40px] h-[40px] border flex items-center justify-center text-[16px] font-[500] mb-[40px] absolute"
          :style="index % 2 === 0? 'left: -20px; top: 0;' : 'right: -20px; top: 0;'"
          :class="item.step === casimirRoadmapLocation? 'bg-blue_3 text-white' : 'text-grey_4 bg-white'"
        >
          {{ item.step }}
        </div>
        
        <h6
          class="text-[18px] font-[500] mb-[20px] whitespace-nowrap w-full h-full px-[30px]"
          :style="item.step === casimirRoadmapLocation? 'color: #80abff' : 'color: #a6a6a6'"
          :class="index % 2 === 0? 'text-left ' : 'text-right'"
        >
          <h6 class="mt-[10px] text-[12px] font-[600] tracking-wide text-grey_3">
            {{ item.projectedCompletionTime }}
          </h6>

          <h2 class="mt-[5px] font-[600]">
            {{ item.title }}
          </h2>

          <p class="text-[14px] font-[400] mt-[10px] whitespace-normal">
            {{ item.description }}
          </p>
        </h6>
      </div>
    </div>
  </div>
</template>


<style scoped></style>