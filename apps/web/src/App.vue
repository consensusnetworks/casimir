<script lang="ts" setup>
  import { RouterView } from 'vue-router'
  import DefaultLayout from '@/layouts/default-layout.vue'
  import useTxData from '@/mockData/mock_transaction_data'
  import { onMounted } from 'vue'
  import useUsers from '@/composables/users'

  const { mockData } = useTxData()
  // Need this to fix initilizing bug between user.ts and ssv.ts
  const { user } = useUsers()
  onMounted(() => {
    mockData()
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
