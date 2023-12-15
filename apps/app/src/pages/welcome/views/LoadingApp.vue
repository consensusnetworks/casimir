<script setup>
import Loading from "@/components/elements/Loading.vue"
</script>

<template>
  <div
    class="page_container flex items-center justify-center"
  >
    <div class="w-[300px] h-[300px] opacity-60">
      <Loading :show-text="false" />
    </div>
  </div>
</template>

<style scoped>
</style>
