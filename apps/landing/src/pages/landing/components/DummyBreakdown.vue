<script lang="ts" setup>
// eslint-disable-next-line no-undef
const props = defineProps({
    title: {
        type: String,
        required: true,
    },
    amount: {
        type: String,
        required: true,
    },
    exchange: {
        type: String,
        required: true,
    },
})


</script>

<template>
  <div class="w-full px-[20px] py-[15px]">
    <h6 class="balance_title mb-[15px] w-full text-start">
      {{ props.title }}
    </h6>
    <div class="flex items-end  justify-between gap-[12px]">
      <h5 class="balance_eth">
        {{ props.amount }}
      </h5>
      <span class="balance_usd pb-[4px]">
        {{ props.exchange }}
      </span>
    </div>
  </div>
</template>


<style scoped>

.balance_eth{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 20px;
  color: #344054;
  @media (max-width: 1210px) {
    font-size: 24px;
  };
  @media (max-width: 1100px) {
    font-size: 22px;
  };
}
.balance_title{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: -0.01em;
  color: #667085;
  @media (max-width: 1210px) {
    font-size: 12px;
    line-height: 18px;
  };
  @media (max-width: 1100px) {
    font-size: 10px;
    line-height: 16px;
  };
}
.balance_usd{
  font-family: 'IBM Plex Sans';
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  letter-spacing: -0.01em;
  color: #7D8398;
  @media (max-width: 1210px) {
    font-size: 14px;
  };
  @media (max-width: 1100px) {
    font-size: 12px;
  };
}
</style>