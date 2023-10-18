<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue"
import VueFeather from "vue-feather"

const avgAPY = ref("5.2%")
const openTimeFrameOptions = ref(false)
const selectedTimeframe = ref("Last Week")

const timeframeOptions = ref(
  [
    "Last Week",
    "1 Month",
    "6 Months",
    "12 Months",
    "Historical"
  ]
)

// eslint-disable-next-line no-undef
const props = defineProps({
  viewId: {
    type: String,
    required: true,
  }
})

const handleOutsideClick = (event: any) => {
  const staking_avg_timeframe_button = document.getElementById(`${props.viewId}_staking_avg_timeframe_button`)
  const staking_avg_timeframe_options = document.getElementById(`${props.viewId}_staking_avg_timeframe_options`)

  if (staking_avg_timeframe_options && staking_avg_timeframe_button) {
    if (openTimeFrameOptions.value) {
      if (!staking_avg_timeframe_options.contains(event.target)) {
        if (!staking_avg_timeframe_button.contains(event.target)) {
          openTimeFrameOptions.value = false
        }
      }
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
  <div class="card_container px-[22px] pt-[22px] pb-[23px] text-black">
    <div class="flex justify-between items-start mb-[13px]">
      <h6 class="card_title tooltip_container">
        Estimated Staking Rewards

        <div class="tooltip w-[200px] left-0">
          Ethereum actively staked through Casimir from connected wallet addresses. Does not include withdrawn stake. 
        </div>
      </h6>
      <div
        class="whitespace-nowrap relative w-[120px]"
      >
        <button
          :id="`${props.viewId}_staking_avg_timeframe_button`"
          class="
          flex justify-between items-center gap-[8px] px-[10px] py-[8px] card_input w-[120px] outline-none h-[38px]
          "
          @click="openTimeFrameOptions = !openTimeFrameOptions"
        >
          {{ selectedTimeframe }}
          <vue-feather
            :type="openTimeFrameOptions? 'chevron-up' : 'chevron-down'" 
            size="36"
            class="icon w-[20px] h-min text-[#667085]"
          />
        </button>
        <div
          v-show="openTimeFrameOptions"
          :id="`${props.viewId}_staking_avg_timeframe_options`"
          class="
          absolute z-[20] w-full top-[110%] left-0 rounded-[8px] px-[10px] py-[14px] bg-white border h-max flex 
          flex-wrap
          "
        >
          <button
            v-for="item in timeframeOptions"
            :key="item"
            class="w-full border text-center rounded-[8px] py-[4px] text-[14px] my-[5px] hover:bg-grey_1"
            @click="selectedTimeframe = item, openTimeFrameOptions = false"
          >
            {{ item }}
          </button>
        </div>
      </div>
    </div>

    <div class="card_metric flex items-end gap-[9px]">
      <h6>
        {{ avgAPY }}
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
    font-size: 12px;
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