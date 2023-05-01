<script lang="ts" setup>
import { onMounted } from 'vue'
// eslint-disable-next-line no-undef
onMounted(() => {
    // Needed for new Icon Library

    // eslint-disable-next-line no-undef
    feather.replace()
})
</script>

<template>
  <div class="card_container px-[21px] pt-[15px] pb-[19px] text-black">
    <h6 class="card_title mb-[11px]">
      Staking Provider
    </h6>

    <div class="card_input text-black">
      <div class="flex items-center gap-[8px]">
        <img
          src="/Mastercard.svg"
          alt="Master card Icon"
          class="border border-[#F2F4F7] rounded-[4px] p-[6px]"
        >
        <h6>
          SSB Providers
        </h6>
      </div>
      
      <i
        data-feather="chevron-down" 
        class="w-[20px]"
      />
    </div>

    <p class="card_message mb-[14px]">
      The provider you are staking to
    </p>

    <h6 class="card_title mb-[11px]">
      Sale Amount
    </h6>

    <div class="card_input text-black">
      <div class="flex items-center gap-[8px]">
        <h6 class="text-[#667085]">
          $
        </h6>
        <h6>
          1,000.00
        </h6>
      </div>
      <div class="flex items-center gap-[4px]">
        <h6 style="font-weight: 400;">
          USD
        </h6>
        <i
          data-feather="chevron-down" 
          class="w-[20px]"
        />
      </div>
    </div>

    <p class="card_message">
      The amount to stake in set currency
    </p>

    <div class="flex justify-between items-center mt-[32px]">
      <div class="flex items-center gap-[12px]">
        <i
          data-feather="help-circle" 
          class="w-[14px] text-[#98A2B3]"
        /> 
        <h6 class="card_analytics_label">
          Fees
        </h6>
      </div>
      <h6 class="card_analytics_amount">
        0.02 ETH
      </h6>
    </div>
    <div class="flex justify-between items-center my-[10px]">
      <div class="flex items-center gap-[12px]">
        <i
          data-feather="help-circle" 
          class="w-[14px] text-[#98A2B3]"
        /> 
        <h6 class="card_analytics_label">
          APY %
        </h6>
      </div>
      <h6 class="card_analytics_amount">
        0.5%
      </h6>
    </div>
    <div class="flex justify-between items-center mb-[39px]">
      <div class="flex items-center gap-[12px]">
        <i
          data-feather="help-circle" 
          class="w-[14px] text-[#98A2B3]"
        /> 
        <h6 class="card_analytics_label">
          Estimated Gas Fee
        </h6>
      </div>
      <h6 class="card_analytics_amount">
        0.0041324
      </h6>
    </div>

    <div class="flex items-center gap-[18px] mb-[27px]">
      <input type="checkbox"> 
      <p class="card_checkbox_text">
        I agree to the terms of service for the single transaction
      </p>
    </div>

    <button class="card_button h-[37px] w-full ">
      Stake
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

.card_title{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 20px;
    color: #344054;
}

.card_input{
    height: 44px;
    width: 100%;
    background: #FFFFFF;
    border: 1px solid #D0D5DD;
    box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 10px;

    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 24px;
    letter-spacing: -0.01em;
    color: #101828;
    margin-bottom: 6px;
}

.card_message {
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    line-height: 20px;
    letter-spacing: -0.01em;
    color: #667085;
}

.card_button {
    background: #0F6AF2;
    border-radius: 5px;
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: -0.03em;
    color: #FFFFFF;
}

.card_analytics_label {
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 20px;
    color: #98A2B3;
}

.card_analytics_amount {
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 20px;
    text-align: right;
    color: #344054;
}

.card_checkbox_text{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-size: 11px;
    line-height: 14px;
    letter-spacing: -0.01em;

    color: #344054;
}
</style>