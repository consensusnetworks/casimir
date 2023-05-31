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
        Last Week 

        <i
          data-feather="chevron-down" 
          class="w-[20px] h-min text-[#667085]"
        />
      </div>
    </div>

    <div class="card_metric flex items-end gap-[9px]">
      <h6>
        5.2%
      </h6>
      <span class="mb-[3px]">
        APY
      </span>
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
    width: 300px;
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