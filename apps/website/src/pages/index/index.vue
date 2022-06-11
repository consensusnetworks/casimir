<script lang="ts" setup>
import { ArrowRightIcon } from '@heroicons/vue/solid'
import { ref, onMounted } from 'vue'
import Puddles from './Puddles.vue'

  const email = ref('')
  async function onSubmit() {
    console.log(email.value)
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    }
    try {
      const response = await fetch(
        'http://localhost:4000/api/users/signup',
        requestOptions
      )
      console.log('response :>> ', response)
      const data = await response.json()
    } catch (err) {
      console.log('err with onSubmit :>> ', err)
    }
  }


  const slideshowProgress = ref(0)
  const currentSlide = ref(0)
  onMounted(() => {
      setInterval(() => {
        slideshowProgress.value = slideshowProgress.value + .1
        if(slideshowProgress.value >= 100) {
          slideshowProgress.value = 0
          currentSlide.value = (currentSlide.value + 1 ) !== 3 ? currentSlide.value + 1 : 0
        }
      }, 0.00000002)
  })
  

</script>

<template>
  <div class="pb-[50px]">
    <div class="flex flex-wrap">
      <div class="pl-[100px] pt-[80px] basis-1/2 ">
        <button
          class="flex bg-[#F36F38]/[0.13] hover:bg-[#F36F38]/[0.25] py-1 rounded-3xl text-[#F36F38] w-[270px] text-sm"
          @click="$router.push('/whitepaper')"
        >
          <span class="bg-white px-4 rounded-3xl mr-2 ml-1">Casimir</span>
          Read the whitepaper
          <ArrowRightIcon class="w-[15px] h-[20px] mx-2" />
        </button>
        <h1 class="header-text text-[#101828] my-4">
          <span
            class="mr-2 text-[#F36F38]"
            @click="$router.push('/')"
          >
            Your
          </span> 
          digital assets
        </h1>
        <h1 class="header-text text-[#101828] my-4">
          <span
            class="mr-2 text-[#c4c4c4]"
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
          <span class="small-text text-[#667085] pl-[5px]">We won't spam you, promise</span>
        </form>
      </div>
      <div class="basis-1/2 pl-[20px] pt-[100px]">
        <Puddles />
      </div>
    </div>
    <div class="w-full h-[400px] bg-[#c4c4c4]/[.5] relative my-[100px]">
      <div
        v-if="currentSlide === 0"
        class="slideshow"
      >
        <div class="grid grid-cols-2 gap-4">
          <div class="p-[50px] text-center">
            <img
              src="dashboard.png"
              class="ml-[100px] h-[300px] object-cover"
              alt=""
            >
          </div>
          <div>
            <h1 class="text-[42px] p-[50px]  align-center">
              <span class="text-[#F36F38] font-extrabold">Manage</span> your assets and earnings across chains, See all of your Coins and NFTs in one dashbaord
            </h1>
          </div>
        </div>
      </div>
      <div
        v-if="currentSlide ===1"
        class="slideshow"
      >
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h1 class="text-[32px] p-[80px] ml-[20px]  align-center">
              <span class="text-[#F36F38] font-extrabold">Earn</span> by staking your assets to high performing validators.  Participate in liquidity pools.  Help keep staking decentralized with a strong set of independent validators
            </h1>
          </div>
          <div class="relative">
            <img
              src="earn.png"
              class="h-[190px] absolute top-[160px] right-[420px] object-cover"
              alt=""
            >
            <div class="relative">
              <img
                src="earn2.png"
                class="h-[190px] absolute top-[70px] right-[190px] object-cover"
                alt=""
              >
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="currentSlide === 2"
        class="slideshow"
      >
        <div class="grid grid-cols-2 gap-4">
          <div class="relative">
            <img
              src="earn3.png"
              class="h-[190px] absolute top-[160px] left-[420px] object-cover"
              alt=""
            >
            <div class="relative">
              <img
                src="learn.png"
                class="h-[190px] absolute top-[70px] left-[190px] object-cover"
                alt=""
              >
            </div>
          </div>
          <div>          
            <h1 class="text-[32px] p-[80px] ml-[20px]  align-center">
              <span class="text-[#F36F38] font-extrabold">Learn</span> about the latest airdops, mints and up to date protocol news. Stay safe with built in security features like smart contract scanning
            </h1>
          </div>
        </div>
      </div>
      <div class="w-full h-1 absolute bottom-0 border">
        <div
          class="bg-[#F36F38]/[.5] h-full"
          :style="{ 'width': slideshowProgress + '%'}"
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
              src="twitter.svg"
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
              src="discord.svg"
              alt=""
            >
          </a>
          
          <a
            href="https://github.com/consensusnetworks/casimir"
            target="_blank"
            class="w-[25px]"
          >
            <img
              src="github.svg"
              alt=""
            >
          </a>
        </div>
        <div class="flex justify-center w-full pt-4">
          <img
            src="copyrightIcon.svg"
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
  font-size: 18px;
  font-weight: 300;
  line-height: 30px;
}

.header-text {
  font-family: Inter;
  font-size: 60px;
  font-weight: 600;
  line-height: 72px;
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
  font-size: 14px;
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

.slideshow {
  height: 100%;
  animation: appear 1.5s ease-in-out;
}

</style>
