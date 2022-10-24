<script lang="ts" setup>
  import NavBar from '@/components/nav/NavBar.vue'
</script>
<template>
  <div class="h-screen overflow-auto">
    <div class="h-navbar">
      <NavBar />
    </div>
    <div class="h-routerview overflow-auto">
      <router-view />
    </div>
  </div>
</template>
