<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue"
import VueFeather from "vue-feather"

const message = ref("We've just announced our series A!")
const openReadUpdate = ref(false)

// eslint-disable-next-line no-undef
const props = defineProps({
  viewId: {
    type: String,
    required: true,
  }
})

const handleOutsideClick = (event: any) => {
  const announcement_container = document.getElementById(`${props.viewId}_announcement_container`)
  const announcement_card = document.getElementById(`${props.viewId}_announcement_card`)
  if (announcement_container && announcement_card) {
    if (openReadUpdate.value 
      && announcement_container.contains(event.target)
      && !announcement_card.contains(event.target)) 
    {
      openReadUpdate.value = false
    }
  }
}

onMounted(() => {
  window.addEventListener("click", handleOutsideClick)
})

onUnmounted(() =>{
  window.removeEventListener("click", handleOutsideClick)
})
</script>

<template>
  <div class="card_container px-[26px] pt-[24px] pb-[21px] text-black">
    <div class="flex justify-end items-center mb-[1px]">
      <!-- TD: figure out how the X function works -->
      <!-- <vue-feather
        type="x"
        size="36"
        class="icon w-[10px] h-min text-[#667085]"
      /> -->
    </div>
    <div class="w-min card_alert mb-[12px]">
      <vue-feather
        type="alert-circle"
        size="36"
        class="icon w-[20px] h-min text-[#475467]"
      />
    </div>
    <div class="mb-[14px]">
      <p class="card_announcement">
        {{ message }}
      </p>
    </div>
    <div class="mb-[19px]">
      <span class="card_announcement_info">
        Read about it and changes.
      </span>
    </div>
    <button
      :id="`${props.viewId}_announcement_button`"
      class="card_announcement_button"
      @click="openReadUpdate = true"
    >
      Read update
    </button>
    <div
      v-if="openReadUpdate"
      :id="`${props.viewId}_announcement_container`"
      class="w-full h-full bg-black/[0.15] absolute top-0 left-0 flex items-center justify-center"
    >
      <div
        :id="`${props.viewId}_announcement_card`"
        class="bg-white px-[14px] py-[10px] rounded-[8px] text-[12px] max-w-[80%] max-h-[80%] overflow-auto shadow-lg"
      >
        Update Here
        <button @click="openReadUpdate = false">
          X
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card_container{
    width: 100%;
    box-sizing: border-box;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.04);
    border-radius: 3px;
}

.card_alert {
    background: #F2F4F7;
    border: 8px solid #F9FAFB;
    border-radius: 28px;
}
.card_announcement{
    width: 165px;
    height: 48px;
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 24px;
    color: #344054;
}

.card_announcement_info{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 16px;
    line-height: 24px;
    color: #475467;
}

.card_announcement_button{
    width: 185px;
    height: 40px;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 16px;
    line-height: 24px;
    color: #344054;
}
</style>