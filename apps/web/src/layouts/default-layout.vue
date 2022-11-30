<script lang="ts" setup>
import SideNav from '@/components/navigation/SideNav.vue'
</script>

<template>
  <div
    id="layout"
    class="h-screen flex min-h-[600px]"
  >
    <SideNav />
    <div
      id="content"
      class="w-full bg-white px-margins py-marginsY overflow-y-auto"
    >
      <slot />
    </div>
  </div>
</template>