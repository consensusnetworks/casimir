<script lang="ts" setup>
import { ArrowRightIcon } from '@heroicons/vue/solid'
import { ref, Ref } from 'vue'
import Puddles from '@/components/Puddles.vue'
import useSlideshow from '@/composables/slideshow'
import useUsers from '@/composables/users'
const { slideshowProgress, currentSlide } = useSlideshow()
const { signupUser } = useUsers()
const successMessage: Ref = ref<HTMLDivElement>()
const invalidMessage: Ref = ref<HTMLDivElement>()

const email = ref('')
const botTrapInput = ref('')
const timeArrived = ref(new Date().getTime())

async function onSubmit() {
  const validEmail = validateEmail(email.value)
  const isBotTrap = botTrapInput.value.length ? true : false
  if (isBotTrap) return
  if (!validEmail) {
    invalidMessage.value.style.display = 'block'
    return
  }

  const timeNow = new Date().getTime()
  const timeDiff = timeNow - timeArrived.value
  if (timeDiff < 3000) {
    invalidMessage.value.style.display = 'block'
    return
  }

  try {
    const newEmail = email.value
    email.value = ''
    successMessage.value.style.display = 'block'
    await signupUser(newEmail)
  } catch (err) {
    console.log('err with onSubmit :>> ', err)
  }
}

const hideMessages = () => {
  successMessage.value.style.display = 'none'
  invalidMessage.value.style.display = 'none'
}

/**
 *
 *
 * @param email {string} email string from user input to validate
 */
function validateEmail(email: string) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  if (email.length < 5 || email.length > 100) {
    return false
  }
  return re.test(String(email).toLowerCase())
}
</script>

<template>
  <div class="p-[50px]">
    <div class="flex flex-wrap">
      <div class="min-w-[375px] w-1/2">
        <button
          class="flex bg-[#F36F38]/[0.13] hover:bg-[#F36F38]/[0.25] py-1 rounded-3xl text-[#F36F38] w-[270px] text-sm"
          @click="$router.push('/whitepaper')"
        >
          <span class="bg-white px-4 rounded-3xl ml-1">Casimir</span> &nbsp;
          Read the whitepaper
          <ArrowRightIcon class="w-[15px] h-[20px] mx-2" />
        </button>
        <h1 class="header-text text-[#101828] mt-4 pb-0">
          <span class="text-[#F36F38]" @click="$router.push('/')">
            Your
          </span>
          digital assets
        </h1>
        <h1 class="header-text text-[#101828] mb-4">
          <span class=" text-[#c4c4c4]" @click="$router.push('/')">
            All
          </span>
          in one place
        </h1>
        <h1 class="body-text text-[#667085] py-[40px]">
          Non-custodial digital asset management and staking
        </h1>
        <form novalidate @submit.prevent="onSubmit">
          <div class="mt-10 grid grid-cols-5 gap-2 ">
            <input
              v-model="email"
              type="text"
              placeholder="Sign up for early access"
              class="border border-[#D0D5DD] rounded-md px-4 py-2 col-span-3 input-text text-[#F36F38]"
              @click="hideMessages"
            />
            <input
              v-model="botTrapInput"
              class="bot-trap"
              type="text"
              placeholder="Bot Trap"
            />
            <button
              type="submit"
              class="bg-[#F36F38] button-text text-white py-2 px-4 rounded-md w-[130px] hover:bg-[#F36F38]/[.75]"
            >
              Early Access
            </button>
          </div>
          <div
            id="success-message"
            ref="successMessage"
            class="small-text text-[#077d01] pl-[5px]"
          >
            Thank you for submitting!
          </div>
          <div
            v-show="email.length > 0"
            id="invalid-message"
            ref="invalidMessage"
            class="small-text text-[#7d0101] pl-[5px]"
          >
            Please enter a valid email.
          </div>
          <span class="small-text text-[#667085] pl-[5px]"
            >We won't spam you. We promise.</span
          >
        </form>
      </div>
      <div class="min-w-[370px] w-1/2 h-[500px] relative overflow-hidden">
        <Puddles class="absolute right-[-300px] top-[-200px]" />
      </div>
    </div>

    <div
      class="border w-full p-[50px] bg-[#c4c4c4]/[.5] mt-[100px] min-w-[395px]"
    >
      <div v-if="currentSlide === 0" class="flex flex-wrap slideshow">
        <div class="min-w-[375px] w-1/2 pl-[50px] pt-[50px] slideshow">
          <img
            src="/Dashboard.png"
            class="p-[5%] h-[90%] object-cover"
            alt=""
          />
        </div>
        <div class="min-w-[375px] w-1/2 pt-[50px] pr-[50px]">
          <h1 class="text-[42px] text-left ">
            <span class="text-[#F36F38] font-extrabold">Manage</span> your
            assets and earnings across chains. See all of your coins and NFTs in
            one dashboard.
          </h1>
        </div>
      </div>
      <div v-if="currentSlide === 1" class="flex flex-wrap slideshow">
        <div class="min-w-[375px] w-1/2 pl-[50px] pt-[50px]">
          <img src="/earn.png" class="p-[5%] h-[90%] object-cover" alt="" />
        </div>
        <div class="min-w-[375px] w-1/2 pt-[50px] pr-[50px]">
          <h1 class="text-[42px] text-left ">
            <span class="text-[#F36F38] font-extrabold">Earn</span> by staking
            your assets to high performing validators. Participate in liquidity
            pools. Help keep staking decentralized with a strong set of
            independent validators.
          </h1>
        </div>
      </div>
      <div v-if="currentSlide === 2" class="flex flex-wrap slideshow">
        <div class="min-w-[375px] w-1/2 pl-[50px] pt-[50px]">
          <img src="/earn3.png" class="p-[5%] h-[90%] object-cover" alt="" />
        </div>
        <div class="min-w-[375px] w-1/2 pt-[50px] pr-[50px]">
          <h1 class="text-[42px] text-left ">
            <span class="text-[#F36F38] font-extrabold">Learn</span> about the
            latest airdops, mints, and protocol news. Stay safe with built-in
            security features like smart contract scanning.
          </h1>
        </div>
      </div>
      <div class="w-full h-1 border border-red ">
        <div
          class="bg-[#F36F38]/[.5] h-full"
          :style="{ width: slideshowProgress + '%' }"
        />
      </div>
    </div>

    <div class="flex flex-wrap justify-center mt-[200px]">
      <div class="flex justify-center gap-4">
        <a
          href="https://mobile.twitter.com/CasimirAssets"
          target="_blank"
          class="w-[25px]"
        >
          <img src="/twitter.svg" alt="" class="border" />
        </a>
        <a href="https://discord.gg/hkJD9gnN" target="_blank" class="w-[25px]">
          <img src="/discord.svg" alt="" />
        </a>

        <a
          href="https://github.com/consensusnetworks/casimir"
          target="_blank"
          class="w-[25px]"
        >
          <img src="/github.svg" alt="" />
        </a>
      </div>
    </div>
    <div class="flex flex-wrap justify-center">
      <img src="/CopyrightIcon.svg" alt="" class="w-[20px]" />
      <a
        href="https://consensusnetworks.com/"
        target="_blank"
        class="text-[#F36F38] mx-4"
        >Consensus Networks</a
      >
      <span> | All Right Reserved</span>
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
  background: linear-gradient(
    307.15deg,
    #f36f38 -3.58%,
    #f36f38 -3.58%,
    #f36f38 -3.57%,
    rgba(243, 111, 56, 0.16) 137.28%
  );
}

.slideshow {
  animation: appear 1.5s ease-in-out;
}

#success-message {
  display: none;
}

#invalid-message {
  display: none;
}

.bot-trap {
  display: none;
}
</style>
