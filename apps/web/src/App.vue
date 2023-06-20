<script lang="ts" setup>
  import useUsers from '@/composables/users'
  import { RouterView } from 'vue-router'
  import DefaultLayout from '@/layouts/default-layout.vue'
  import { onMounted } from 'vue'

  // Need this to fix initilizing bug between user.ts and ssv.ts
  const { user } = useUsers()
  
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
