
<script setup lang="ts">
// eslint-disable-next-line no-undef
const props = defineProps({
  currentSlide: {
    type: Number,
    required: true
  }
})
</script>

<template>
  <div>
    <slot :current-slide="props.currentSlide" /> 
  </div>
</template>

<style scoped>

</style>