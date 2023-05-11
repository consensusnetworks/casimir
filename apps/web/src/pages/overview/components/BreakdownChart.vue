<script lang="ts" setup>
import LineChartJS from '@/components/charts/LineChartJS.vue'
import { onMounted } from 'vue'

onMounted(() => {
    // Needed for new Icon Library
    // eslint-disable-next-line no-undef
    feather.replace()
})
</script>

<template>
  <div class="card_container px-[32px] pt-[31px] pb-[77px] text-black">
    <div class="flex gap-[68px] mb-[52px]">
      <div>
        <h6 class="blance_title mb-[15px]">
          Total Staked
        </h6>
        <div class="flex items-center gap-[12px]">
          <h5 class="blance_amount">
            $150
          </h5>
          <span class="blance_exchange">
            0.00054 ETH
          </span>
        </div>
      </div>
      <div>
        <h6 class="blance_title mb-[15px]">
          Staking Rewards
        </h6>
        <div class="flex items-center gap-[12px]">
          <h5 class="blance_amount">
            $17.25
          </h5>
          <span class="blance_exchange">
            0.004 ETH
          </span>
        </div>
      </div>
    </div>
    <div class="flex justify-between items-start">
      <div>
        <h6 class="card_title">
          Ethereum Balance
        </h6>
        <div class="flex items-center gap-[22px]">
          <div class="flex gap-[10px] items-center">
            <div class="w-[9px] h-[9px] bg-[#2F80ED] rounded-[999px]" />
            <span class="legent_label">
              Primary Account
            </span>
          </div>
        </div>
      </div>
      <div class="border border-[#D0D5DD] rounded-[8px] overflow-hidden">
        <button class="timeframe_button rounded-l-[]">
          1 month
        </button>
        <button class="timeframe_button border-x border-x-[#D0D5DD] bg-[#F3F3F3]">
          6 months
        </button>
        <button class="timeframe_button border-r border-r-[#D0D5DD]">
          12 months
        </button>
        <button class="timeframe_button">
          historical
        </button>
      </div>
    </div>
    <hr class="w-full bg-[#EAECF0] mt-[20px] mb-[24px]">
    <div class="flex justify-between items-center gap-[4px]">
      <div class="chart_y_label w-[18px]">
        Y-axis label
      </div>
      <div
        :id="'line_chart_container_cross_provider_chart'" 
        class="w-full h-[240px]"
      >
        <LineChartJS
          :id="'cross_provider_chart'"
          :legend="false"
          :x-grid-lines="false"
          :y-grid-lines="true"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.blance_exchange{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  letter-spacing: -0.01em;
  color: #7D8398;
}
.blance_amount{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 28px;
  color: #344054;
}
.blance_title{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.01em;
  color: #667085;
}
.chart_y_label{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 18px;
    text-align: center;
    color: #667085;
    transform: rotate(-90deg);
    white-space: nowrap;
}
.timeframe_button{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 10px;
    line-height: 20px;
    color: #344054;
    padding: 5px 10px;
}
.legent_label{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 11px;
    line-height: 20px;
    color: #8B8B8B;
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
    line-height: 28px;
    color: #101828;
}
</style>