<script lang="ts" setup>
import NavBar from '@/components/NavBar.vue'
import Footer from '@/components/Footer.vue'

</script>

<template>
  <div class="w-full h-screen overflow-y-auto min-w-[360px]">
    <div 
      class="absolute top-0 left-0 w-full"
      style="z-index: 2;"
    >
      <NavBar
        class="sticky top-0 left-0 w-full px-[60px] 800s:px-[5%] z-[999]"
      />
      <RouterView
        class="w-full px-[60px] 800s:px-[5%]"
      />
      <Footer
        class="px-[60px] 800s:px-[5%]  " 
      />
    </div>
    

    <div
      class="absolute w-full h-[700px] bg-black top-0 left-0"
      style="z-index: 0;"
    />
  </div>
</template>


<style scoped>
</style>