<script lang="ts" setup>
import { RouterView } from "vue-router"
import DefaultLayout from "@/layouts/default-layout.vue"

function helloChris() {
  console.log("sjfd;askdnmj")
}
</script>
  
<template>
  <Suspense>
    <component :is="DefaultLayout">
      <RouterView />
    </component>
  </Suspense>
</template>
