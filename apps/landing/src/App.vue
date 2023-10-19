<script lang="ts" setup>
// Initalize blogs here for least amount of fetch calls
import useBlog from '@/composables/blog'
useBlog()
</script>

<template>
  <div>
    <router-view />
  </div>
</template>


<style scoped></style>@/composables/blog