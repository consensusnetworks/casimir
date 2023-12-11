<script setup>
import { ref } from "vue"
import { useDark, useToggle, useStorage } from "@vueuse/core"

const isDark = useDark()
const toggleDark = useToggle(isDark)

const acceptTerms = ref(false)
const acceptTermsStorage = useStorage("acceptTerms", acceptTerms)
</script>

<template>
  <div>
    Basic App
    <button @click="toggleDark()">
      toggle light/dark mode
    </button>


    <button @click="acceptTerms = !acceptTerms">
      toggle terms of service {{ acceptTermsStorage }}
    </button>
  </div>
</template>

<style scoped></style>
