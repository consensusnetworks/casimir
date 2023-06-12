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
  <div class="card_container px-[21px] pt-[15px] pb-[19px] text-black h-full">
    <h6 class="account_blance mb-[12px]">
      Account Balance
    </h6>
    <h5 class="account_balance_amount mb-[27px]">
      $2,740
    </h5>
    <h6 class="card_title mb-[11px]">
      Wallet
    </h6>

    <div class="card_input text-black mb-[22px]">
      <div class="flex items-center gap-[8px]">
        <h6>
          0x834...7C4621976578
        </h6>
      </div>
      
      <i
        data-feather="chevron-down" 
        class="w-[20px]"
      />
    </div>

    <h6 class="card_title mb-[11px] mt-[22px]">
      Amount
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
        <h6 class="card_analytics_label">
          Fees
        </h6>
      </div>
      <h6 class="card_analytics_amount">
        0.0002 ETH
      </h6>
    </div>
    <div class="flex justify-between items-center my-[10px]">
      <div class="flex items-center gap-[12px]">
        <h6 class="card_analytics_label">
          Exchange Price
        </h6>
      </div>
      <h6 class="card_analytics_amount">
        1 USD - 0.000ETH
      </h6>
    </div>
    <div class="flex justify-between items-center mb-[39px]">
      <div class="flex items-center gap-[12px]">
        <h6 class="card_analytics_label">
          Estimated APY
        </h6>
      </div>
      <h6 class="card_analytics_amount">
        $0.04
      </h6>
    </div>

    <div class="flex items-center gap-[18px] mb-[27px]">
      <input
        type="checkbox"
        class="card_checkbox"
      > 
      <p class="card_checkbox_text">
        I agree to the terms of service
      </p>
    </div>

    <button
      class="card_button h-[37px] w-full "
      disabled
    >
      Stake
    </button>
  </div>
</template>

<style scoped>
.account_balance_amount{
  font-style: normal;
  font-weight: 500;
  font-size: 28px;
  line-height: 20px;
  letter-spacing: -0.01em;
  color: #344054;
}
.account_blance{
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 20px;
  letter-spacing: -0.01em;
  color: #667085;
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
}:disabled{
  background: rgba(15, 106, 242, 0.31);
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
    text-decoration-line: underline;
    color: #344054;
}

.card_checkbox{
    background: #FFFFFF;
    border: 1px solid #7F7889;
    box-shadow: 0px 0px 0px 4px rgba(237, 235, 255, 0.26);
    border-radius: 4px;
}
</style>