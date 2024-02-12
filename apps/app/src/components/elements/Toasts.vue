<script setup>
import useToasts from "@/composables/state/toasts"
import { ref } from "vue"
import ToastContent from "@/components/elements/ToastContent.vue"
const { toasts } = useToasts()

const showMiniToast = ref(null)
const toastExists = (t) => {
    return toasts.value.some((toast) => toast.id === t.id)
}

</script>

<template>
  <div
    v-if="toasts && toasts.length < 5" 
    class="toasts_container_vertical"
  >
    <transition-group
      name="toast_vertical"
      tag="div"
      class="overflow-hidden pb-[12px] "
    >
      <div
        v-for="i in toasts"
        :key="i"
        class="toast relative overflow-hidden"
      >
        <ToastContent
          :toast="i"
        />
        <div
          v-if="i.timed"
          class="absolute bottom-0 left-0 w-full h-[4px]"
        >
          <div class="expand bg-black dark:bg-white h-full" />
        </div>
      </div>
    </transition-group>
  </div>
  <div
    v-else-if="toasts.length > 4"
    class="toasts_container_horizontal overflow-hidden"
  >
    <transition
      name="mini_toast_expand"
      tag="div"
      class="overflow-hidden border"
    >
      <div
        v-show="showMiniToast && toastExists(showMiniToast)"
        class="mb-[12px] toast"
        @mouseleave="showMiniToast = null"
      >
        <ToastContent
          :toast="showMiniToast"
        />
      </div>
    </transition>
    <transition-group
      name="toast_horizontal"
      tag="div"
      class="overflow-hidden flex items-center gap-[12px] pb-[12px]"
    >
      <div
        v-for="i in toasts"
        :key="i"
        class="toast_mini"
        @mouseover="showMiniToast = i"
      >
        <ToastContent
          :toast="i"
          :mini="true"
        />
      </div>
    </transition-group>
  </div>
</template>

<style scoped>

.toast_vertical-enter, .toast_vertical-enter-active{
  animation: slide_up 0.4s ease-in;
}

@keyframes slide_up {
  0% {
    transform: translateY(+100%);
  }
  100% {
    transform: translateY(0);
  }
}

.toast_vertical-leave, .toast_vertical-leave-to{
  animation: slide_right 0.4s ease-out;
}

@keyframes slide_right {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(+100%);
  }
}


/* Horizonatal Toasts */
.toast_horizontal-enter, .toast_horizontal-enter-active{
  animation: slide_left 0.4s ease-in;
}

@keyframes slide_left {
  0% {
    transform: translateX(+100%);
  }
  100% {
    transform: translateX(0);
  }
}

.toast_horizontal-leave, .toast_horizontal-leave-to{
  animation: slide_down 0.4s ease-out;
}

@keyframes slide_down {
  0% {
    transform: translateY(0%);
  }
  100% {
    transform: translateY(+100%);
  }
}

/* mini_toast_expand */
.mini_toast_expand-enter, .mini_toast_expand-enter-active{
  animation: slide_left 0.6s ease-in;
}

.mini_toast_expand-leave, .mini_toast_expand-leave-to{
  animation: slide_right 0.8s ease-out;
}

.expand{ 
  width: 0; 
  animation: expand 3s ease-in forwards;
}

@keyframes expand {
  0% {
    width: 0%;
  }
  100%{
    width: 100%;
  }
}
</style>
