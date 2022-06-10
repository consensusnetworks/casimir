<script lang="ts" setup>
import { ArrowRightIcon } from '@heroicons/vue/solid'
</script>

<template>
  <div class="pb-[50px]">
    <div class="flex flex-row flex-wrap">
      <div class="pl-[100px] pt-[80px] pb-[50px] pr-[10px] basis-1/2 ">
        <div class="max-w-[560px]">
          <button 
            class="flex bg-[#F36F38]/[0.13] hover:bg-[#F36F38]/[0.25] py-1 rounded-3xl text-[#F36F38] w-[270px] text-sm"
            @click="$router.push('/whitepaper')"
          >
            <span class="bg-white px-4 rounded-3xl mr-2 ml-1">Casimir</span>
            Read the whitepaper
            <ArrowRightIcon class="w-[15px] h-[20px] mx-2" />
          </button>
          <h1 class="header-text text-[#101828] my-4">
            Infrastructure to manage your digital assets
          </h1>
          <span class="body-text text-[#667085]">
            Non-custodial cross chain staking platform with high performing validators and nodes
          </span>

          <div class="mt-10 grid grid-cols-5 gap-2 ">
            <input
              type="text"
              placeholder="Enter your email"
              class="border border-[#D0D5DD] rounded-md px-4 py-2 col-span-3 input-text text-[#F36F38]"
            >
            <button class="bg-[#F36F38] button-text text-white py-2 px-4 rounded-md w-[130px] hover:bg-[#F36F38]/[.75]">
              Get Started
            </button>
          </div>
          <span class="small-text text-[#667085]"> We won't spam you, promise</span>
        </div>
      </div>
      <div class="basis-1/2">
        <div class="linear-bg w-full h-full pt-[30%] pl-[30%]">
          <img
            src="/web-demo.svg"
            alt=""
            class="float-right h-[100%]"
          >
        </div>
      </div>
    </div>
    <div class="flex-row mt-[40px] body-text text-center">
      <span class="text-center text-sm text-[#667085]">Supporting 12+ protocols and growing</span>
      <div class="flex flex-wrap justify-around px-[35px] mt-[35px]">
        <a
          href="https://cosmos.network/"
          target="_blank"
        >
          <img
            src="/cosmos.svg"
            alt=""
            class="h-[25px]"
          >
        </a>
        <a
          href="https://iotex.io/start"
          target="_blank"
        >
          <img
            src="/iotex.svg"
            alt=""
            class="h-[25px]"
          >
        </a>
        <a
          href="https://livepeer.org/"
          target="_blank"
        >
          <img
            src="/livepeer.svg"
            alt=""
            class="h-[25px]"
          >
        </a>
        <a
          href="https://www.kava.io/"
          target="_blank"
        >
          <img
            src="/kava.png"
            alt=""
            class="h-[25px]"
          >
        </a>
        <a
          href="https://polkadot.network/"
          target="_blank"
        >
          <img
            src="/p.svg"
            alt=""
            class="h-[25px]"
          >
        </a>
        <a
          href="https://www.factomprotocol.org/"
          target="_blank"
        >
          <img
            src="/factom.svg"
            alt=""
            class="h-[25px]"
          >
        </a>
      </div>
    </div>
  </div>
</template>

<style>
.body-text {
  font-family: Inter;
  font-size: 18px;
  font-weight: 300;
  line-height: 30px;
  letter-spacing: 0em;
}

.header-text {
  font-family: Inter;
  font-size: 60px;
  font-weight: 600;
  line-height: 72px;
  letter-spacing: -0.02em;
}

.input-text {
  font-family: Inter;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  letter-spacing: 0em;
}

.button-text {
  font-family: Inter;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  letter-spacing: 0em;
}

.small-text {
  font-family: Inter;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: 0em;
}


.linear-bg {
  background: linear-gradient(307.15deg, #F36F38 -3.58%, #F36F38 -3.58%, #F36F38 -3.57%, rgba(243, 111, 56, 0.16) 137.28%);
}
</style>