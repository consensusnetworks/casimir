<script setup>
import useToasts from "@/composables/state/toasts"

const { toasts, addToast, removeToast } = useToasts()
</script>

<template>
  <div class="toasts_container">
    <button @click="addToast({name: 'toast', id: Math.random()})">
      add
    </button>
    <transition-group
      name="toast"
      tag="div"
    >
      <div
        v-for="i in toasts"
        :key="i"
        class="toast"
      >
        toast card {{ i.id }} 
        <button @click="removeToast(i.id)">
          x
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active, .toast-leave-active {
  transition: transform 0.5s;
}

.toast-enter, .toast-leave-to {
  transform: translateY(100%);
}

.toast-leave-active {
  transform: translateX(100%);
}
</style>
