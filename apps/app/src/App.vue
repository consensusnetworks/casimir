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

    <h1>Header 1</h1>
    <h2>Header 2</h2>
    <h3>Header 3</h3>
    <h4>Header 4</h4>
    <h5>Header 5</h5>
    <h6>Header 6</h6>
    <p>Paragraph</p>
    <small>Small Text</small>
  </div>
</template>

<style scoped></style>
