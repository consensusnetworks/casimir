<script lang="ts" setup>
import NavBar from '@/components/nav/NavBar.vue'


</script>
<template>
  <div class="h-screen min-w-[360px] overflow-auto">
    <div class="h-navbar">
      <NavBar />
    </div>
    <div class="overflow-auto">
      <router-view />
    </div>
  </div>
</template>
