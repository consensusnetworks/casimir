<template>
  <Suspense>
    <component :is="layout">
      <RouterView />
    </component>
  </Suspense>
</template>

<script lang="ts" setup>
import { useRoute, RouterView } from 'vue-router'
import { ref, markRaw, watch } from 'vue'
import DefaultLayout from '@/layouts/default-layout.vue'
const route = useRoute()
const layout = ref(markRaw(DefaultLayout))

watch(() => route.path, (value) => {
    // Alternative blog layout example
    if (value.includes('/blog')) {
        // layout.value = markRaw(BlogLayout)
    } else {
        layout.value = markRaw(DefaultLayout)
    }
})
</script>
