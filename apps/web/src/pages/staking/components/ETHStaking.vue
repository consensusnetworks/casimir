<script lang="ts" setup>

// eslint-disable-next-line no-undef
const props = defineProps({
    toggleModal: {
        type: Function,
        required: true
    }
})

</script>
  
<template>
  <div class="w-full">
    eth staking

    <button
      class="btn_primary"
      @click="toggleModal(null)"
    >
      X
    </button>
  </div>
</template>
