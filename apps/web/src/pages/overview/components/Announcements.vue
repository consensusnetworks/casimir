<script lang="ts" setup>
import { onMounted } from 'vue'

onMounted(() => {
    // Needed for new Icon Library
    // eslint-disable-next-line no-undef
    feather.replace()
})
</script>

<template>
  <div class="card_container px-[26px] pt-[24px] pb-[21px] text-black">
    <div class="flex justify-end items-center mb-[1px]">
      <i
        data-feather="x" 
        class="w-[10px] h-min text-[#667085]"
      /> 
    </div>
    <div class="w-min card_alert mb-[12px]">
      <i
        data-feather="alert-circle" 
        class="w-[20px] h-min text-[#475467]"
      /> 
    </div>
    <div class="mb-[14px]">
      <p class="card_announcement">
        We've just announced our series A!
      </p>
    </div>
    <div class="mb-[19px]">
      <span class="card_announcement_info">
        Read about it and changes.
      </span>
    </div>
    <button class="card_announcement_button">
      Read update
    </button>
  </div>
</template>

<style scoped>
.card_container{
    width: 100%;
    height: 100%;
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