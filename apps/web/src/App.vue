<script lang="ts" setup>
  import { RouterView } from 'vue-router'
  import DefaultLayout from '@/layouts/default-layout.vue'
  import MobileLayout from '@/layouts/mobile-layout.vue'
  import useTxData from '@/mockData/mock_transaction_data'
  import { onMounted, onUnmounted, ref, watch} from 'vue'
  import useUsers from '@/composables/users'

  const { mockData } = useTxData()
  // Need this to fix initilizing bug between user.ts and ssv.ts
  const { user } = useUsers()

  const screenWidth = ref(0)
  const screenHeight = ref(0)

  const showMobileView = ref(false)

  const findScreenDimenstions = () => {
    screenWidth.value = window.innerWidth
    screenHeight.value = window.innerHeight
  }

  watch([screenWidth, screenHeight], () => {
    if( screenWidth.value <= 600){
      showMobileView.value = true
    } else if(screenWidth.value > screenHeight.value && screenWidth.value <= 800) {
      showMobileView.value = true
    } else {
      showMobileView.value = false
    }
  })

  onMounted(() => {
    findScreenDimenstions()

    window.addEventListener('resize', findScreenDimenstions)
    window.addEventListener('orientationchange', findScreenDimenstions)
    mockData()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', findScreenDimenstions)
    window.addEventListener('orientationchange', findScreenDimenstions)
  })
</script>
  
<template>
  <Suspense>
    <component
      :is="showMobileView? MobileLayout : DefaultLayout"
    >
      <RouterView />
    </component>
  </Suspense>
</template>
