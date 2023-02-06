<script lang="ts" setup>
import TopNav from '@/components/navigation/TopNav.vue'
import useUsers from '@/composables/users'
import { onMounted, ref } from 'vue'

const { user } = useUsers()

const showNoUserWarning = ref(false)
const loadingWidthMeasurement = ref(0)
onMounted(() => {
  // console.log('hello world', user.value.id)
  if(user.value.id.length === 0){
    showNoUserWarning.value = true
    const loadingInterval = setInterval(()=>{
      if(loadingWidthMeasurement.value >= 100 || user.value.id.length > 0){
        showNoUserWarning.value = false
        clearInterval(loadingInterval)
      }
      loadingWidthMeasurement.value = loadingWidthMeasurement.value + 0.1
    }, 10)
  }
  
})
</script>

<template>
  <div class="h-[100vh]">
    <div class="h-[100%]">
      <div class="h-full flex flex-col items-center">
        <div class="min-w-[360px] w-full">
          <TopNav />
        </div>

        <div
          v-if="showNoUserWarning"
          class="flex flex-col items-center justify-center w-full bg-blue_3"
        >
          <div
            class=" 
            max-w-[1280px] min-w-[360px] text-white 
            py-15
            "
          >
            You currently do not have any wallets connected, 
            Visit our Multi-Wallet to connect your primary wallet. 
          </div>
          <div
            class="bg-primary h-2 transition"
            :style="`width: ${loadingWidthMeasurement}%;`"
          />
        </div>
        <div
          class="max-w-[1280px] min-w-[360px] h-full 
            w-full px-25 py-margins"
        >
          <slot />
        </div>
      </div>
    </div>
    

    <!-- bellow is the view for when the screen width gets below 360px -->
    <div
      class="not-sr-only noscreen:sr-only h-screen
       w-full flex flex-col justify-center items-center"
    >
      <!-- Maybe add animation here -->
      <i
        class="iconoir-enlarge-round-arrow text-[36px]"
      />
      <h6 class="text-grey_2">
        Rotate screen to view app
      </h6>
    </div>
  </div>
</template>