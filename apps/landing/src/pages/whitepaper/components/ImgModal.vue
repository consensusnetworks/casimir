<script lang="ts" setup>
    import { ref } from 'vue'
    const showModal = ref(false)

    // eslint-disable-next-line no-undef
    const props = defineProps({
        alt: {
            type: String,
            required: true,
        },
        src: {
            type: String,
            required: true
        },
        text: {
            type: String,
            required: true
        },
        width: {
          type: String,
          required: true
        }
    })
</script>

<template>
  <div>
    <img
      :src="src"
      :alt="alt"
      class="cursor-pointer"
      @click="showModal = !showModal"
    >
    <div
      v-show="showModal"
      class="modal"
      @click="showModal = !showModal"
    >
      <div 
        class="modal-content text-center px-margins py-[25px] flex flex-col justify-center zoom-anim"
        :style="{
          'width': width
        }"
      >
        <h6
          :style="{
            'font-family': 'OpenSauceOneSemibold'
          }"
          class="mb-[50px]"
        >
          {{ text }}
        </h6>
        <img
          :src="src"
          :alt="alt"
          class=""
        >
      </div>
    </div>
  </div>
</template>
