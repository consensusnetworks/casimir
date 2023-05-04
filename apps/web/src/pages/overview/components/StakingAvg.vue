<script lang="ts" setup>
import { onMounted } from 'vue'

onMounted(() => {
    // Needed for new Icon Library
    // eslint-disable-next-line no-undef
    feather.replace()
})
</script>

<template>
  <div class="card_container px-[22px] pt-[22px] pb-[23px] text-black">
    <div class="flex justify-between items-start mb-[13px]">
      <h6 class="card_title">
        Avg. Staking Reward
      </h6>
      <div class="flex justify-between items-center gap-[8px] px-[10px] py-[8px] card_input">
        Per day 

        <i
          data-feather="chevron-down" 
          class="w-[20px] h-min text-[#667085]"
        />
      </div>
    </div>

    <div class="card_metric flex items-end gap-[3px] mb-[19px]">
      <h6>
        2,437
      </h6>
      <span>
        units
      </span>
    </div>

    <div class="relative h-[179px] w-full">
      <div class="my-[7px] flex justify-start items-center relative z-[1]">
        <span class="card_chart_label">SSV</span>
        <div class="rounded-[8px] h-[24px] w-[112px] bg-[#9BA4B5] overflow-hidden">
          <div class="w-[80%] h-full bg-[#4B5059]" />
        </div>
      </div>
      <div class="my-[7px] flex justify-start items-center relative z-[1]">
        <span class="card_chart_label">KV</span>
        <div class="rounded-[8px] h-[24px] w-[172px] bg-[#9BA4B5] overflow-hidden">
          <div class="w-[80%] h-full bg-[#4B5059]" />
        </div>
      </div>
      <div class="my-[7px] flex justify-start items-center relative z-[1]">
        <span class="card_chart_label">MEP</span>
        <div class="rounded-[8px] h-[24px] w-[81px] bg-[#9BA4B5] overflow-hidden">
          <div class="w-[80%] h-full bg-[#4B5059]" />
        </div>
      </div>
      <div class="my-[7px] flex justify-start items-center relative z-[1]">
        <span class="card_chart_label">ZAP</span>
        <div class="rounded-[8px] h-[24px] w-[214px] bg-[#9BA4B5] overflow-hidden">
          <div class="w-[80%] h-full bg-[#4B5059]" />
        </div>
      </div>
      <div
        v-for="i in 8"
        :key="i"
        class="absolute w-[1px] bg-[#EFEFEF] z-[0]"
        :class="i % 2 === 0? 'top-[-13px]' : 'top-0'"
        :style="`height: calc(153px); left: calc(${i * 29}px)`"
      />

      <div
        v-for="i in 4"
        :key="i"
        class="absolute z-[0] bottom-[10px] x_label"
        :style="`left: calc(${((i-1) * (29 *2)) + 29}px)`"
      >
        {{ (i - 1) * 1000 }}
      </div>
    </div>

    <div class="flex items-center gap-[26px] mt-[31px]">
      <div class="flex items-center gap-[12px]">
        <div class="rounded-[999px] w-[8px] h-[8px] bg-[#4B5059]" />
        <h6 class="chart_legend_label">
          Average Gain
        </h6>
      </div>
      <div class="flex items-center gap-[12px]">
        <div class="rounded-[999px] w-[8px] h-[8px] bg-[#9BA4B5]" />
        <h6 class="chart_legend_label">
          Net Loss
        </h6>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart_legend_label{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 24px;
    color: #000000;
}
.x_label{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 13px;
    line-height: 17px;
    letter-spacing: -0.01em;
    color: #98A2B3;
}
.card_chart_label{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: -0.01em;
    color: #4B5059;
    width: 29px;
}
.card_container{
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.04);
    border-radius: 3px;
}

.card_title{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 18px;
    line-height: 23px;
    letter-spacing: -0.01em;
    color: #000000;
    width: 120px;
}

.card_input{
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 24px;
    color: #101828;
}

.card_metric h6{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 22px;
    line-height: 29px;
    letter-spacing: -0.01em;
    color: #000000;
}

.card_metric span{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    letter-spacing: -0.01em;
    color: #98A2B3;
}
</style>