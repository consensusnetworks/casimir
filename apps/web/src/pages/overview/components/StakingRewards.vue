<script lang="ts" setup></script>

<template>
  <div class="card_container px-[19px] pt-[16px] pb-[31px] flex flex-col justify-between">
    <h6 class="card_title">
      Staking Rewards
    </h6>
    <div class="flex text-black items-start gap-[12px]">
      <h6 class="card_balance">
        $1,489.0
      </h6>
      <span class="card_balance_percentage">
        +52%
      </span>
    </div>
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
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0.01em;
    color: #000000;
}

.card_balance{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 26px;
    line-height: 34px;
    letter-spacing: -0.01em;
    color: #000000;
}

.card_balance_percentage{
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: -0.01em;
    color: #42B738;
}
</style>