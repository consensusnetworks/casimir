<script setup>
import { 
    XMarkIcon,
    XCircleIcon,
    CheckCircleIcon,
} from "@heroicons/vue/24/outline"
import useToasts from "@/composables/state/toasts"
import Loading from "@/components/elements/Loading.vue"
const { removeToast } = useToasts()

// eslint-disable-next-line no-undef
const props = defineProps({
    toast: {
        type: Object,
        required: true,
    },
    mini: {
        type: Boolean,
        default: false
    }
})
</script>

<template>
  <div
    v-if="!props.mini && props.toast"
    class="flex items-start justify-between gap-[30px] relative"
  >
    <div class="flex items-start gap-[12px]">
      <div class="w-[38px] h-[38px] rounded-[999px] overflow-hidden">
        <img
          v-if="props.toast.type === 'info'"
          :src="props.toast.iconUrl"
          :alt="props.toast.iconUrl + ' icon'"
          class="w-[38px] h-[38px]"
        >
        <div 
          v-else-if="props.toast.type === 'success'"
        >
          <CheckCircleIcon 
            class="w-full h-full"
          />
        </div>
        <div 
          v-else-if="props.toast.type === 'failed'"
        >
          <XCircleIcon 
            class="w-full h-full"
          />
        </div>
        <div 
          v-else-if="props.toast.type === 'loading'"
          class="w-full h-full"
        >
          <Loading :show-text="false" />
        </div>
      </div>
      <div>
        <h1 class="card_title">
          {{ props.toast.title }}
        </h1>
        <h2 class="card_subtitle max-w-[200px]">
          {{ props.toast.subtitle }}
        </h2>
      </div>
    </div>
    <button @click="removeToast(props.toast.id)">
      <XMarkIcon class="w-[16px] h-[16px]" />
    </button>
  </div>
  <div
    v-else-if="props.mini && props.toast"
    class="w-[24px] h-[24px] rounded-[999px] overflow-hidden"
  >
    <img
      v-if="props.toast.type === 'info'"
      :src="props.toast.iconUrl"
      :alt="props.toast.iconUrl + ' icon'"
      class="w-full h-full"
    >
    <div 
      v-else-if="props.toast.type === 'success'"
    >
      <CheckCircleIcon 
        class="w-full h-full"
      />
    </div>
    <div 
      v-else-if="props.toast.type === 'failed'"
    >
      <XCircleIcon 
        class="w-full h-full"
      />
    </div>
    <div 
      v-else-if="props.toast.type === 'loading'"
      class="w-full h-full"
    >
      <Loading :show-text="false" />
    </div>
  </div>
</template>

<style scoped></style>
