<script setup>
// import { ref } from "vue"
// import { useDark, useToggle, useStorage } from "@vueuse/core"
import NavBar from "@/components/elements/NavBar.vue"
import ConnectWalletModal from "@/components/elements/ConnectWalletModal.vue"
import useConnectWalletModal from "@/composables/state/connectWalletModal"

const { openConnectWalletModal } = useConnectWalletModal()
// const acceptTerms = ref(false)
// const acceptTermsStorage = useStorage("acceptTerms", acceptTerms)
</script>

<template>
  <div class="app_container">
    <NavBar />
    <div class="app_container_inner">
      <router-view />
    </div>

    <ConnectWalletModal v-show="openConnectWalletModal" />
    <!-- 
    <button @click="acceptTerms = !acceptTerms">
      toggle terms of service {{ acceptTermsStorage }}
    </button>
    -->
  </div>
</template>

<style scoped></style>
