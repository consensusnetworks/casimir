<template>
  <Suspense>
    <Component :is="layout">
      <RouterView />
    </Component>
  </Suspense>
</template>

<script lang="ts" setup>
import { ref, markRaw } from 'vue'
import DefaultLayout from '@/layouts/default-layout.vue'
const layout = ref(markRaw(DefaultLayout))
</script>
