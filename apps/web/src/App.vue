<script lang="ts" setup>
  import { RouterView } from 'vue-router'
  import DefaultLayout from '@/layouts/default-layout.vue'  
</script>
  
<template>
  <Suspense>
    <component
      :is="DefaultLayout"
    >
      <RouterView />
    </component>
  </Suspense>
</template>
