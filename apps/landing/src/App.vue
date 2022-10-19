<script lang="ts" setup>
import NavBar from './components/nav/NavBar.vue'
</script>
<template>
  <div class="bg-black text-white h-screen">
    <!-- No Layout needed -->
    <NavBar />
    <RouterView />
  </div>
</template>
