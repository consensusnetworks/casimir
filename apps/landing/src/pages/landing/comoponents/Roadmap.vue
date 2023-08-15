<script lang="ts" setup>
import useRoadmap from '@/composables/roadmapItems'
import VueFeather from 'vue-feather'

const { roadmapItems, casimirRoadmapLocation } = useRoadmap()
</script>

<template>
  <div class="my-[60px]">
    <div class="text-center my-[60px]">
      <span class="text-[14px] font-[600] text-primary">Roadmap</span>
      <h1 class="text-[36px] font-[600] mt-[20px]">
        The Steps Ahead
      </h1>
      <p class="text-[16px] font-[400] text-grey_4">
        Navigating the Journey: Tracking Our Progress and Current Phase.
      </p>
    </div>

    <div class="w-full flex items-start justify-around flex-wrap gap-[50px]">
      <div
        v-for="(item, index) in roadmapItems"
        :key="index"
        class="flex flex-col items-center justify-center"
      >
        <div
          class="rounded-[999px] w-[100px] h-[100px] border flex items-center justify-center text-[46px] font-[500] mb-[40px]"
          :class="item.step === casimirRoadmapLocation? 'bg-blue_3 text-white' : 'text-grey_4'"
        >
          {{ item.step }}
        </div>
        <h6
          class="text-[18px] font-[500] mb-[20px]"
          :class="item.step === casimirRoadmapLocation? 'text-blue_3' : 'text-grey_4'"
        >
          {{ item.title }}
        </h6>
        <p
          class="text-[14px] font-[400] mb-[20px] max-w-[300px]"
          :class="item.step === casimirRoadmapLocation? 'text-blue_3' : 'text-grey_4'"
        >
          {{ item.description }}
        </p>
      </div>
    </div>
  </div>
</template>


<style scoped></style>