<script lang="ts" setup>
import Scrambler from '@/components/Scrambler.vue'

</script>

<template>
  <div class="border h-screen w-full flex flex-col gap-[20px] justify-center items-center bg-[#D0D6E1]">
    <div>
      <div class="flex justify-center items-center gap-[20px]">
        <img
          src="/ETHLogo.svg"
          alt=""
          class="h-[200px]"
        >
        <div>
          <div class=" flex gap-[10px]">
            <img
              src="/casimir.svg"
              alt=""
              class="h-[20px]"
            >
            <Scrambler 
              :phrases="['Non-Custodial']"
              :repeat="false"
              :delay="0"
              :text-class="'font-semibold text-[16px] text-[#343434] leading-[24px] tracking-normal'"
              :transform-timer="5"
            />
          </div>
          
          <Scrambler 
            :phrases="['Ethereum Staking']"
            :repeat="false"
            :delay="200"
            :text-class="'font-medium text-[76px] text-[#3a3a3a] leading-[120px] tracking-wider'"
            :transform-timer="15"
          />
        </div>
      </div>
      <div class="flex flex-col justify-center items-end gap-[25px]">
        <div class="flex gap-[3px]">
          <Scrambler 
            :phrases="['No minimum amount.', 'Maximum staking rewards.']"
            :repeat="true"
            :delay="300"
            :text-class="'font-semibold text-[20px] text-[#3a3a3a] leading-[30px] tracking-normal'"
            :transform-timer="10"
          /> 
          <span class="pulse w-[1px] bg-primary" />
        </div>
        <!-- TD: change link to match app link not landing link -->
        <a
          class=" rounded-[4px] flex justify-center items-center gap-[10px]
        bg-primary text-white px-[25px] py-[7px] font-bold hover:bg-blue_4
        hover:text-black"
          href="https://www.casimir.co/"
        >
          <i
            class="iconoir-drone-take-off"
          /> Launch App
        </a>
      </div>
    </div>
  </div>
</template>


<style scoped>
.pulse{
  animation: pulse 1.25s infinite ease-in-out;
}

@keyframes pulse {
  from,
  to {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>