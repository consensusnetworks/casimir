<script setup>
import { useDark, useToggle } from "@vueuse/core"

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <div class="text-white dark:text-red-500">
    Basic App {{ isDark }}
    <button @click="toggleDark()">
      toggle light/dark mode
    </button>
  </div>
</template>

<style scoped></style>
