<script lang="ts" setup>
import VueFeather from 'vue-feather'
</script>

<template>
  <div class="card_container px-[21px] pt-[15px] pb-[19px] text-black h-full relative text-left">
    <h6 class="addressBalance mb-[12px]">
      Wallet Balance
    </h6>
    <h5 class="addressBalance_amount mb-[5px]">
      99.98 ETH
    </h5>
    <div class="text-[12px] mb-[5px] text-blue-400">
      <span class=" font-[900]">54.32</span> ETH Currently Staked
    </div>
    <h6 class="card_title mb-[11px]">
      Wallet
    </h6>
    <div class="card_input text-black mb-[22px] relative">
      <div
        id="selectWalletInputButton"
        class="flex items-center justify-between gap-[8px] w-full h-full px-[10px] py-[14px] text-black"
      >
        <h6>
          Oxd5****a212
        </h6>
        <vue-feather
          type="chevron-down"
          size="36"
          class="icon w-[20px]"
        />
      </div>
    </div>

    <div class="flex justify-between items-center gap-[8px] mb-[11px] mt-[22px]">
      <h6 class="card_title">
        Amount
      </h6>
    </div>

    <div class="card_input text-black px-[10px] py-[14px]">
      <div class="flex items-center gap-[8px]">
        <input
          id="amount"
          type="text"
          pattern="^\d{1,3}(,\d{3})*(\.\d+)?$"
          placeholder="0.00"
          class=" outline-none"
        >
      </div>
      <div class="flex items-center gap-[4px]">
        <h6 style="font-weight: 400;">
          ETH
        </h6>
      </div>
    </div>

    <p class="card_message">
      The amount to stake in set currency
    </p>

    <div class="flex justify-between items-center mt-[22px]">
      <div class="flex items-center gap-[12px]">
        <h6 class="card_analytics_label">
          Fees
        </h6>
      </div>
      <h6 class="card_analytics_amount">
        5.00%
      </h6>
    </div>
    <div class="flex justify-between items-center my-[10px]">
      <div class="flex items-center gap-[12px]">
        <h6 class="card_analytics_label">
          Exchange Rate
        </h6>
      </div>
      <h6 class="card_analytics_amount">
        $1851.47/ETH
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
      <button
        id="termsOfServiceButton"
        class="card_checkbox_text"
      >
        I agree to the terms of service
      </button>
    </div>

    <div
      class="card_button  h-[37px] w-full bg-primary"
    >
      <div
        class="flex items-center justify-center gap-[5px] h-full"
      >
        Stake
      </div>
    </div>
  </div>
</template>

<style scoped>
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-bottom: 5px;
  background-color: #fff;
}

.dots_container .dot:nth-last-child(1) {
  animation: jumpingAnimation 1s 0.1s ease-in infinite;
}

.dots_container .dot:nth-last-child(2) {
  animation: jumpingAnimation 1s 0.2s ease-in infinite;
}

.dots_container .dot:nth-last-child(3) {
  animation: jumpingAnimation 1s 0.3s ease-in infinite;
}

@keyframes jumpingAnimation {
  0% {
    transform: translate3d(0, 0, 0);
  }

  50% {
    transform: translate3d(0, 6px, 0);
  }

  100% {
    transform: translate3d(0, 0, 0);
  }
}

.addressBalance_amount {
  font-style: normal;
  font-weight: 500;
  font-size: 24px;
  line-height: 20px;
  letter-spacing: -0.01em;
  color: #344054;
}

.addressBalance {
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 20px;
  letter-spacing: -0.01em;
  color: #667085;
}

.card_container {
  width: 100%;
  height: 100%;
}

.card_title {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 12px;
  line-height: 20px;
  color: #344054;
}

.card_input {
  height: 44px;
  width: 100%;
  background: #FFFFFF;
  border: 1px solid #D0D5DD;
  box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  /* background: #0F6AF2; */
  border-radius: 5px;
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  letter-spacing: -0.03em;
  color: #FFFFFF;
}

:disabled {
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

.card_checkbox_text {
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 400;
  font-size: 11px;
  line-height: 14px;
  letter-spacing: -0.01em;
  text-decoration-line: underline;
  color: #344054;
}

.card_checkbox {
  background: #FFFFFF;
  border: 1px solid #7F7889;
  box-shadow: 0px 0px 0px 4px rgba(237, 235, 255, 0.26);
  border-radius: 4px;
}
</style>