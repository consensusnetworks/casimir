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
        height: {
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
      :style="{
        height: height
      }"
      @click="showModal = !showModal"
    >
    <div
      v-show="showModal"
      class="modal grid place-content-center"
      @click="showModal = !showModal"
    >
      <div 
        class="modal-content bg-transparent text-center px-margins py-[25px] flex flex-col justify-center zoom-anim"
        :style="{
          'width': width
        }"
      >
        <img
          :src="src"
          :alt="alt"
          class=""
        >
      </div>
    </div>
  </div>
</template>
