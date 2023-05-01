<script lang="ts" setup>
  import useUsers from '@/composables/users'
  import { RouterView } from 'vue-router'
  import DefaultLayout from '@/layouts/default-layout.vue'
  import { onMounted } from 'vue'

  // Need this to fix initilizing bug between user.ts and ssv.ts
  const { user } = useUsers()

  onMounted(() => {
    // Needed for new Icon Library

    // eslint-disable-next-line no-undef
    feather.replace()
  })
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
