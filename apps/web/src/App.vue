<script lang="ts" setup>
  import { RouterView } from 'vue-router'
  import DefaultLayout from '@/layouts/default-layout.vue'
  import MobileLayout from '@/layouts/mobile-layout.vue'
  import useTxData from '@/mockData/mock_transaction_data'
  import { onMounted, onUnmounted, ref} from 'vue'
  import useUsers from '@/composables/users'

  const { mockData } = useTxData()
  // Need this to fix initilizing bug between user.ts and ssv.ts
  const { user } = useUsers()

  const screenWidth = ref(0)

  // Made this to be 600 due to how our components look, I think anything below 600 would look best in a mobile view (tablets and below)
  const mobileWidthLimits = ref(600)

  const findScreenDimenstions = () => {
    screenWidth.value = window.innerWidth
  }

  onMounted(() => {
    findScreenDimenstions()

    window.addEventListener('resize', findScreenDimenstions)
    mockData()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', findScreenDimenstions)
  })
</script>
  
<template>
  <Suspense>
    <component
      :is="screenWidth <= mobileWidthLimits? MobileLayout : DefaultLayout"
    >
      <RouterView />
    </component>
  </Suspense>
</template>
