<script lang="ts" setup>
import useRoadmap from '@/composables/roadmapItems'
import VueFeather from 'vue-feather'
import useScreenDimentions from '@/composables/screenDimenstions'

const { screenWidth } = useScreenDimentions()

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

    <div class="w-full flex flex-col items-center justify-center px-[10%] gap-[5px]">
      <div
        v-for="(item, index) in roadmapItems"
        :key="index"
        class="flex flex-col items-center justify-center h-[200px] relative"
        :class="index % 2 === 1? 'border-l' : 'border-r'"
      >
        <div
          class="rounded-[999px] w-[40px] h-[40px] border flex items-center justify-center text-[16px] font-[500] mb-[40px] absolute"
          style="top: calc(50% - 20px)"
          :class="item.step === casimirRoadmapLocation? 'bg-blue_3 text-white' : 'text-grey_4 bg-white'"
        >
          {{ item.step }}
        </div>

        <h6
          class="text-[18px] font-[500] mb-[20px] absolute whitespace-nowrap"
          :style="index % 2 === 1? 'left: 30px' : 'right: 30px'"
          style="top: calc(50% - 15px)"
          :class="item.step === casimirRoadmapLocation? 'text-blue_3' : 'text-grey_4'"
        >
          <div
            class="tooltip_container"
            :class="screenWidth < 450? 'whitespace-normal' : ''"
          >
            {{ item.title }}
            <p
              class="tooltip"
            >
              {{ item.description }}
            </p>
          </div>
        </h6>
      </div>
    </div>
  </div>
</template>


<style scoped></style>