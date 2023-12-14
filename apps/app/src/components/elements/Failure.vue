<script setup>
import { ref, onMounted } from "vue"

import { 
    XCircleIcon
} from "@heroicons/vue/24/solid"
import { 
    useDark,
} from "@vueuse/core"


const isDark = useDark()

const wait = ref(true)
onMounted(() => {
    setTimeout(() => {
        wait.value = false
    }, 200)
})
</script>

<template>
  <div
    id="success_container"
    class="relative w-full h-full min-w-[100px] min-h-[100px] flex items-center
    justify-center"
  >
    <XCircleIcon
      v-if="!wait"
      class="w-[50%] h-[50%] z-[10] scale_up initial_hidden text-red"
    />
    <div
      v-if="!wait"
      class="absolute w-full h-full top-0 left-0 z-[1] flex items-center justify-center"
    >
      <div
        class="w-[75%] h-[75%] bg-red/20 blur-[2px] rounded-[999px] scale_up_normal initial_hidden" 
      />
    </div>
  </div>
</template>

<style scoped>

@keyframes scale-up {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
  }
  90% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scale-up-normal {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  70% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.5);
  }
}

.scale_up {
  animation: scale-up 0.3s ease-out forwards;
}

.scale_up_normal{
  animation: scale-up-normal 0.5s ease-out forwards;
}

.initial_hidden {
  opacity: 0;
  transform: scale(0);
}
</style>
