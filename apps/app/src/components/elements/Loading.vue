<script setup>
import { onMounted, onUnmounted, ref, defineProps } from "vue"
import { 
    useDark,
} from "@vueuse/core"

const props = defineProps({
    showText: {
        type: Boolean,
        default: true,
    },
})

const isDark = useDark()
const loadingText = ref("Loading")
const dots = ref("")
let interval

onMounted(() => {
    if (props.showText) {
        let count = 1
        interval = setInterval(() => {
            let placeholder = ""
            for (let i = 0; i < count; i++) {
                placeholder += "."
            }
            dots.value = placeholder
            count < 3 ? (count += 1) : (count = 1)
        }, 500)
    }
})

onUnmounted(() => {
    clearInterval(interval)
})

const wait = ref(true)
const calculateFontSize = () => {
    const baseRatio = 170 
    const container = document.getElementById("loading_container")

    if (container) {
        wait.value = false
        return container.offsetWidth / baseRatio
    }
}
</script>

<template>
  <div
    id="loading_container"
    class="relative w-full h-full "
  >
    <img
      :src="isDark? '/loading_light.svg' :'/loading_dark.svg'"
      alt="Loading Icon"
      class="w-full h-full arrow_spin_animation"
    >

    <div
      v-show="props.showText && !wait"
      class="absolute top-0 left-0 w-full h-full flex items-center 
      justify-center text-black dark:text-white dynamic_text"
      :style="{ fontSize: `${calculateFontSize()}vw` }"
    >
      <h6>{{ loadingText }}{{ dots }}</h6>
    </div>
  </div>
</template>

<style scoped>
.arrow_spin_animation {
    animation: arrow-spin 0.85s cubic-bezier(0.2, 0.8, 0.9, 0.1) infinite;
    -webkit-animation: arrow-spin 0.85s cubic-bezier(0.2, 0.8, 0.9, 0.1) infinite;
}
@keyframes arrow-spin {
  100% {
    transform: rotate(179deg);
  }
}

@-webkit-keyframes arrow-spin {
  100% {
    -webkit-transform: rotate(179deg);
  }
}
.dynamic_text{
    white-space: nowrap;
    overflow: hidden; 
    text-overflow: ellipsis;
    font-size: 10.2px;
}
</style>
