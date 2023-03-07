<script lang="ts" setup>
import TopNav from '@/components/navigation/TopNav.vue'
// import useUsers from '@/composables/users'
// import { onMounted, ref } from 'vue'

// const { user } = useUsers()

// const showNoUserWarning = ref(false)
// const loadingWidthMeasurement = ref(0)
// onMounted(() => {
  // if(user.value.id.length === 0){
  //   showNoUserWarning.value = true
  //   const loadingInterval = setInterval(()=>{
  //     if(loadingWidthMeasurement.value >= 100 || user.value.id.length > 0){
  //       showNoUserWarning.value = false
  //       clearInterval(loadingInterval)
  //     }
  //     loadingWidthMeasurement.value = loadingWidthMeasurement.value + 0.1
  //   }, 10)
  // }
// })
</script>

<template>
  <div class="h-[100vh] overflow-hidden">
    <div class="h-full flex flex-col">
      <div class="min-w-[360px] w-full">
        <TopNav />
      </div>
      <div class="h-full bg-white flex justify-center w-full overflow-y-auto">
        <div class="w-full h-full flex justify-center ">
          <div class="max-w-[1280px] min-w-[360px] w-full px-25">
            <div class="py-25">
              <slot />
            </div>
          </div>
        </div>
      </div>
      
      <div class="visible absolute noscreen:invisible top-0 left-0 h-full w-full bg-white flex flex-col justify-center items-center text-center px-20">
        <i
          class="iconoir-enlarge-round-arrow text-[36px] text-grey_4 mb-10"
        />
        <h6 class="text-grey_4 font-bold mb-20">
          Casimir does not support this size of screen
        </h6>

        <h6 class="text-grey_3">
          Please rotate to a landscape version or use a different device
        </h6>
      </div>
    </div>
  </div>
</template>