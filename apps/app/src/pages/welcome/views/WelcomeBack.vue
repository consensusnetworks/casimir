<script setup>
// import { ref } from "vue"
// import { useDark, useToggle, useStorage } from "@vueuse/core"

// const skipWelcomePage = ref(false)
// const skipWelcomePageStorage = useStorage("skipWelcomePage", skipWelcomePage)
</script>

<template>
  <div
    class="page_container flex items-center justify-center"
  >
    <div>
      <div>
        Welcome back text
      </div>

      <div>
        primary waller
      </div>
      <div>
        secondary wallets (show more if needed)
      </div>
      <div>
        checkbox (auto route to overview)

        <!-- 
    <button @click="acceptTerms = !acceptTerms">
      toggle terms of service {{ acceptTermsStorage }}
    </button>
    -->
      </div>
      <div>
        route to overview button
      </div>
      <div>
        not me button
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
