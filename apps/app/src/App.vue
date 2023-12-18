<script setup>
// import { ref } from "vue"
// import { useDark, useToggle, useStorage } from "@vueuse/core"
import NavBar from "@/components/elements/NavBar.vue"
import Toasts from "@/components/elements/Toasts.vue"
import ConnectWalletModal from "@/components/elements/ConnectWalletModal.vue"
import useConnectWalletModal from "@/composables/state/connectWalletModal"

const { openConnectWalletModal } = useConnectWalletModal()
// const acceptTerms = ref(false)
// const acceptTermsStorage = useStorage("acceptTerms", acceptTerms)

</script>

<template>
  <div class="app_container">
    <NavBar class="z-[999]" />
    <div class="app_container_inner z-[888]">
      <div>
        <router-view />
      </div>

      <Toasts />
    </div>

    <ConnectWalletModal v-show="openConnectWalletModal" />
  </div>
</template>

<style scoped></style>
