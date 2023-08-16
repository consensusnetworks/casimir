<script lang="ts" setup>
import useScreenDimentions from '@/composables/screenDimenstions'
import DummyBreakdown from './comoponents/DummyBreakdown.vue'
import DummyStaking from './comoponents/DummyStaking.vue'
import DummyChart from './comoponents/DummyChart.vue'
import Footer from './comoponents/Footer.vue'
import QuestionsAndAnswers from './comoponents/QuestionsAndAnswers.vue'
import Content from './comoponents/Content.vue'
import Roadmap from './comoponents/Roadmap.vue'
import Features from './comoponents/Features.vue'

const { screenWidth } = useScreenDimentions()
</script>

<template>
  <div class=" text-center pt-[110px] pb-[40px]">
    <!-- Page Header -->
    <h1 class="page_header">
      Ethereum Staking
    </h1>
    <h1 class="page_header">
      Made Simple
    </h1>

    <h2 class="page_subheader my-[40px]">
      Managed Ethereum Nodes Ready For Staking
    </h2>

    <!-- Screenshots -->
    <div
      class="w-full flex items-center justify-between gap-[20px]"
      :class="screenWidth <= 1370? 'flex-wrap' :''"
    >
      <div
        class=" w-[60%] flex items-center justify-between gap-[20px]" 
        :style="screenWidth <= 1370? 'width: 100%' :'width: 60%'"
        :class="screenWidth <= 870? 'flex-wrap-reverse' :''"
      >
        <div
          class="screenshot_card w-full h-[530px]"
          :class="screenWidth <= 870? 'w-full' :'max-w-[300px]'"
        >
          <DummyStaking />
        </div>
        <div class="w-full h-[530px] flex flex-col gap-[20px]">
          <div class="screenshot_card h-full w-full relative">
            <img
              src="https://ethereum.org/static/eth-diamond-purple.svg"
              alt="Ethereum Icon"
              class="absolute top-[50% - 50px] h-[200px] z-[2]"
              :style="'top: calc(50% - 100px); left: calc(50% - 100px)'"
            >
            <div 
              class="absolute top-[50% - 50px] h-[200px] w-[200px]
               bg-black/[0.6] rounded-[999px] opacity-75 blur-[25px] z-[1]"
              :style="'top: calc(50% - 100px); left: calc(50% - 200px)'"
            />
            <div 
              class="absolute top-[50% - 50px] h-[200px] w-[200px]
               bg-primary/[0.6] rounded-[999px] blur-[25px] z-[1]"
              :style="'top: calc(50% - 100px); right: calc(50% - 200px)'"
            />
          </div>
          <div
            v-if="screenWidth >= 500"
            class="h-full flex items-center justify-between gap-[20px]"
          >
            <div class="screenshot_card h-full w-full">
              <DummyBreakdown
                :title="'Available Balance'"
                :amount="'1.98 ETH'"
                :exchange="'$ 15.12 K'"
              />
              <div class="relative h-[80px] mt-[50px]">
                <img
                  src="/walletIcon.svg"
                  alt="Wallet Illustration"
                  class="h-full absolute top-0 z-[1]"
                  :style="'left: calc(50% - 40px)'"
                >
                <div 
                  class="h-[100px] w-[100px] absolute top-[-10px] bg-primary/[0.25] z-[2] rounded-[999px] blur"
                  :style="'left: calc(50% - 50px)'"
                />
              </div>
            </div>
            <div class="w-full h-full flex flex-col gap-[20px]">
              <div class="screenshot_card h-full">
                <DummyBreakdown
                  :title="'Currently Staked'"
                  :amount="'4.32 ETH'"
                  :exchange="'$ 10.21 K'"
                />
              </div>
              <div class="screenshot_card h-full">
                <DummyBreakdown
                  :title="'Rewards Earned'"
                  :amount="'14.2 ETH'"
                  :exchange="'$ 2.32 K'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="screenshot_card w-[40%] h-[530px]" 
        :style="screenWidth <= 1370? 'width: 100%' :'width: 40%'"
      >
        <DummyChart />
      </div>
    </div>

    <!-- Features -->
    <Features class="my-[15px] w-full" />  
    
    <!-- Litepaper Content -->
    <Content class="my-[275px] w-full" />

    <!-- Roadmap -->
    <Roadmap class="mb-[150px] w-full" />

    <!-- Q&As -->
    <QuestionsAndAnswers class="my-[15px] w-full" />

    <!-- Footer -->
    <Footer class="my-[15px] w-full" />
  </div>
</template>


<style scoped>

.screenshot_card{
    border-radius: 8px;
    border: 1px solid var(--gray-300, #D0D5DD);
    background: #FFF;
    box-shadow: 0px 12px 16px -4px rgba(16, 24, 40, 0.04);
    overflow: hidden;
}

.page_header{
    color: #FFF;
    text-align: center;
    font-family: IBM Plex Sans;
    font-size: 65px;
    font-style: normal;
    font-weight: 500;
    line-height: 77px;
    letter-spacing: -3.25px;
}
.page_subheader {
    color: #CECECE;
    text-align: center;
    font-family: IBM Plex Sans;
    font-size: 20px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
}
</style>