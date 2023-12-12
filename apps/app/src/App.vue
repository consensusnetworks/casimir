<script setup>
// import { ref } from "vue"
// import { useDark, useToggle, useStorage } from "@vueuse/core"
import NavBar from "@/components/elements/NavBar.vue"


// const acceptTerms = ref(false)
// const acceptTermsStorage = useStorage("acceptTerms", acceptTerms)
</script>

<template>
  <div class="app_container">
    <NavBar />
    <div class="app_container_inner">
      <router-view />
    </div>
    <!-- 
    <button @click="acceptTerms = !acceptTerms">
      toggle terms of service {{ acceptTermsStorage }}
    </button>
    -->
  </div>
</template>

<style scoped></style>
