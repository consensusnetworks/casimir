<script setup lang="ts">
// 
</script>

<template>
  <div class="slide_left">
    <transition name="slide slide_left">
      <slot /> 
    </transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active{
    transition: opacity 0.7s ease-in-out;
}

.slide-enter-from,
.slide-leave-to{
    opacity: 0;
}

.slide-enter-to,
.slide-leave-from{
    opacity: 1;
}

/*  */

.slide_left-enter-active,
.slide_left-leave-active{
    transition: transform 0.5s;
}

.slide_left-enter-from,
.slide_left-leave-to{
  transform: translateX(100%);
}

.slide_left-enter-to,
.slide_left-leave-from{
    
  transform: translateX(0%);
}
</style>