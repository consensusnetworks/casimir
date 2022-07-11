<script lang="ts" setup>
// import Web3 from 'web3'
import { useRoute, RouterView } from 'vue-router'
import { ref, markRaw, watch } from 'vue'
import DefaultLayout from '@/layouts/default-layout.vue'
const route = useRoute()
const layout = ref(markRaw(DefaultLayout))
// console.log('web3 in App.vue:>> ', web3)
watch(
  () => route.path,
  (value) => {
    // Alternative blog layout example
    if (value.includes('/blog')) {
      // layout.value = markRaw(BlogLayout)
    } else {
      layout.value = markRaw(DefaultLayout)
    }
  }
)
</script>

<template>
  <Suspense>
    <component :is="layout">
      <RouterView />
    </component>
  </Suspense>
</template>
