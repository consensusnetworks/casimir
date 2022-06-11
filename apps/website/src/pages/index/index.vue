<script lang="ts" setup>
import { ArrowRightIcon } from '@heroicons/vue/solid'
import { ref, onMounted } from 'vue'
import Puddles from '@/components/Puddles.vue'

const email = ref('')
async function onSubmit() {
  console.log(email.value)
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.value })
  }
  const baseUrl = import.meta.env.PROD
    ? 'https://w47s4clcwi.execute-api.us-east-2.amazonaws.com/prod'
    : 'http://localhost:4000'
  try {
    const response = await fetch(
      `${baseUrl}/api/users/signup`,
      requestOptions
    )
    console.log('response :>> ', response)
    const data = await response.json()
  } catch (err) {
    console.log('err with onSubmit :>> ', err)
  }
}


const slideshowProgress = ref(0)
const currentSlide = ref(2)
onMounted(() => {
  setInterval(() => {
    slideshowProgress.value += .05
    if (slideshowProgress.value >= 100) {
      slideshowProgress.value = 0
      currentSlide.value = (currentSlide.value + 1) !== 3 ? currentSlide.value + 1 : 0
    }
  }, 0.00000005)
})

</script>

<template>
  <div class="pb-[50px]">
    <div class="flex flex-wrap">
      <div class="pl-[100px] pt-[80px] basis-1/2 ">
        <button
          class="flex bg-[#F36F38]/[0.13] hover:bg-[#F36F38]/[0.25] px-4 py-1 rounded-3xl text-[#F36F38] w-max text-sm"
          @click="$router.push('/whitepaper')"
        >
          Casimir
          Read the whitepaper
          <ArrowRightIcon class="w-[15px] h-[20px] mx-2" />
        </button>
        <h1 class="header-text text-[#101828] mt-4 pb-0">
          <span
            class="text-[#F36F38]"
            @click="$router.push('/')"
          >
            Your
          </span>
          digital assets
        </h1>
        <h1 class="header-text text-[#101828] mb-4">
          <span
            class=" text-[#c4c4c4]"
            @click="$router.push('/')"
          >
            All
          </span>
          in one place
        </h1>
        <h1 class="body-text text-[#667085] py-[40px]">
          Non-custodial digital asset management and staking
        </h1>
        <form
          id="email-form"
          novalidate
          @submit.prevent="onSubmit"
        >
          <div class="mt-10 grid grid-cols-5 gap-2 ">
            <input
              v-model="email"
              type="text"
              placeholder="Enter your email"
              class="border border-[#D0D5DD] rounded-md px-4 py-2 col-span-3 input-text text-[#F36F38]"
            >
            <button
              type="submit"
              class="bg-[#F36F38] button-text text-white py-2 px-4 rounded-md w-[130px] hover:bg-[#F36F38]/[.75]"
            >
              Get Started
            </button>
          </div>
          <span class="small-text text-[#667085] pl-[5px]">We won't spam you. We promise.</span>
        </form>
      </div>
      <div class="basis-1/2 relative">
        <Puddles class="absolute right-0 top-0" />
      </div>
    </div>
    <div class="w-full h-[400px] relative my-[100px]">
      <div
        v-if="currentSlide === 0"
        class="slideshow"
      >
        <div class="flex flex-row flex-wrap bg-[#c4c4c4]/[.5] p-10 min-w-[375px]">
          <div class="text-center min-w-[325px] w-[50%] min-h-[300px]">
            <img
              src="/Dashboard.png"
              class="p-[5%] h-[90%] object-cover"
              alt=""
            >
          </div>
          <div class="min-w-[50%] w-[50%] text-center">
            <h1 class="text-[32px] p-[2.5%] min-w-[325px] text-left ">
              <span class="text-[#F36F38] font-extrabold">Manage</span> your assets and earnings across chains. See all
              of your coins and NFTs in one dashboard.
            </h1>
          </div>
        </div>
      </div>
      <div
        v-if="currentSlide === 1"
        class="slideshow"
      >
        <div class="flex flex-row flex-wrap bg-[#c4c4c4]/[.5] p-10 min-w-[375px]">
          <div class="min-w-[50%] w-[50%] text-center">
            <h1 class="text-[32px] p-[2.5%] min-w-[325px] text-left ">
              <span class="text-[#F36F38] font-extrabold">Earn</span> by staking your assets to high performing
              validators. Participate in liquidity pools. Help keep staking decentralized with a strong set of
              independent validators.
            </h1>
          </div>
          <div class="text-center min-w-[325px] w-[50%] min-h-[300px]">
            <img
              src="/earn.png"
              class="p-[5%] h-[90%] object-cover"
              alt=""
            >
          </div>
        </div>
      </div>
      <div
        v-if="currentSlide === 2"
        class="slideshow"
      >
        <div class="flex flex-row flex-wrap bg-[#c4c4c4]/[.5] p-10 min-w-[375px]">
          <div class="text-center min-w-[325px] w-[50%] min-h-[300px]">
            <img
              src="/earn3.png"
              class="p-[5%] h-[90%] object-cover"
              alt=""
            >
          </div>
          <div class="min-w-[50%] w-[50%] text-center">
            <h1 class="text-[32px] p-[2.5%] min-w-[325px] text-left ">
              <span class="text-[#F36F38] font-extrabold">Learn</span> about the latest airdops, mints, and
              protocol news. Stay safe with built-in security features like smart contract scanning.
            </h1>
          </div>
        </div>
      </div>
      <div class="w-full h-1 border border-red ">
        <div
          class="bg-[#F36F38]/[.5] h-full"
          :style="{ 'width': slideshowProgress + '%' }"
        />
      </div>
      <div class="grid grid-rows-2 text-center py-[50px]">
        <div class="flex justify-center gap-4">
          <a
            href="https://mobile.twitter.com/CasimirAssets"
            target="_blank"
            class="w-[25px]"
          >
            <img
              src="/twitter.svg"
              alt=""
              class="border"
            >
          </a>

          <a
            href="https://discord.gg/hkJD9gnN"
            target="_blank"
            class="w-[25px]"
          >
            <img
              src="/discord.svg"
              alt=""
            >
          </a>

          <a
            href="https://github.com/consensusnetworks/casimir"
            target="_blank"
            class="w-[25px]"
          >
            <img
              src="/github.svg"
              alt=""
            >
          </a>
        </div>
        <div class="flex justify-center w-full pt-4">
          <img
            src="/CopyrightIcon.svg"
            alt=""
            class="w-[20px]"
          >
          <a
            href="https://consensusnetworks.com/"
            target="_blank"
            class="text-[#F36F38] mx-4"
          >Consensus Networks</a>
          <span> | All Right Reserved</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.body-text {
  font-family: Inter;
  font-size: 24px;
  font-weight: 300;
  line-height: 30px;
}

.header-text {
  font-family: Inter;
  font-size: 60px;
  font-weight: 600;
  line-height: 64px;
}

.input-text {
  font-family: Inter;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
}

.button-text {
  font-family: Inter;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
}

.small-text {
  font-family: Inter;
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
}

@keyframes appear {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}

.linear-bg {
  background: linear-gradient(307.15deg,
      #f36f38 -3.58%,
      #f36f38 -3.58%,
      #f36f38 -3.57%,
      rgba(243, 111, 56, 0.16) 137.28%);
}

.slideshow {
  animation: appear 1.5s ease-in-out;
}
</style>
