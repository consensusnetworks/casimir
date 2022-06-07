<script lang="ts" setup>
import { ArrowRightIcon } from '@heroicons/vue/solid'
</script>

<template>
  <div class="">
    <div class="grid grid-cols-2 gap2">
      <div class="pl-[100px] pt-[100px] pb-[50px]">
        <button class="flex bg-[#F36F38]/[0.13] hover:bg-[#F36F38]/[0.25] p-[4px] rounded-3xl text-[#F36F38] w-[275px]">
          <span class="bg-white px-4 rounded-3xl mx-2">Casimir</span>
          Read the whitepaper
          <ArrowRightIcon class="w-[15px] h-[25px] mx-2" />
        </button>
        <h1 class="header-text text-[#101828] my-4 mr-2">
          Infrastructure to manage your digital assets
        </h1>
        <span class="body-text text-[#667085]">
          Non-custodial cross chain staking platform with hight performing validators and nodes
        </span>

        <div class="mt-10 grid grid-cols-5 gap-2 ">
          <input
            type="text"
            placeholder="Enter your email"
            class="border border-[#D0D5DD] rounded-md px-2 col-span-3 input-text text-[#F36F38]"
          >
          <button class="bg-[#F36F38] button-text text-white py-1 px-2 rounded-md w-[100px]">
            Get Started
          </button>
        </div>
        <span class="small-text text-[#667085]"> We won't spam you, promise</span>
      </div>
      <div class="linear-bg relative shrink overflow-hidden">
        <img
          src="web-demo.svg"
          alt=""
          class="absolute bottom-0 right-0 w-[70%]"
        >
      </div>
    </div>
    <div class="flex-row mt-10 body-text text-center">
      <span class="text-center text-sm text-[#667085]">Supporting 12+ protocols and growing</span>
      <div class="flex flex-wrap justify-around px-20 mt-4">
        <img
          src="cosmos.svg"
          alt=""
          class="h-[25px]"
        >
        <img
          src="iotex.svg"
          alt=""
          class="h-[25px]"
        >
        <img
          src="livepeer.svg"
          alt=""
          class="h-[25px]"
        >
        <img
          src="kava.png"
          alt=""
          class="h-[25px]"
        >
        <img
          src="p.svg"
          alt=""
          class="h-[25px]"
        >
        <img
          src="factom.svg"
          alt=""
          class="h-[25px]"
        >
      </div>
    </div>
  </div>
</template>

<style>
.body-text {
  font-family: Open Sauce One;
  font-size: 20px;
  font-weight: 400;
  line-height: 30px;
  letter-spacing: 0em;
}

.header-text {
  font-family: Open Sauce One;
  font-size: 60px;
  font-weight: 600;
  line-height: 72px;
  letter-spacing: -0.02em;
}

.input-text {
  font-family: Open Sauce One;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0em;
}

.button-text {
  font-family: Open Sauce One;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0em;
}

.small-text {
  font-family: Open Sauce One;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0em;
}


.linear-bg {
  background: linear-gradient(307.15deg, #F36F38 -3.58%, #F36F38 -3.58%, #F36F38 -3.57%, rgba(243, 111, 56, 0.16) 137.28%);
}
</style>