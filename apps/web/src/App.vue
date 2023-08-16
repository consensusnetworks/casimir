<script lang="ts" setup>
  import { RouterView } from 'vue-router'
  import DefaultLayout from '@/layouts/default-layout.vue'
  import useTxData from '@/mockData/mock_transaction_data'
  import { onMounted, watch } from 'vue'
  import useUsers from '@/composables/users'

  const { mockData } = useTxData()
  // Need this to fix initilizing bug between user.ts and ssv.ts
  const { user } = useUsers()

  const runMockData = () =>{
    if(user.value?.accounts.length && user.value?.accounts.length > 0){
      const walletAddresses = user.value?.accounts.map(item => {
        return item.address
      }) as string[]
      mockData(walletAddresses)
    }
  }

  watch(user, () =>{
    runMockData()
  })

  onMounted(() => {
    runMockData()
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
