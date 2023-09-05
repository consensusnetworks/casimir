<script lang="ts" setup>
import useScreenDimensions from '@/composables/screenDimensions'
import { onMounted, ref, watch } from 'vue'

const { screenWidth } = useScreenDimensions()

const tabShowing = ref(1)
const interval = ref(null) as any

onMounted(() =>{
  interval.value = setInterval(() =>{
    tabShowing.value === 4? tabShowing.value = 1 : tabShowing.value = tabShowing.value + 1
  }, 5500)
})

watch(tabShowing, ()=>{
  clearInterval(interval.value)

  interval.value = setInterval(() =>{
    tabShowing.value === 4? tabShowing.value = 1 : tabShowing.value = tabShowing.value + 1
  }, 5500)
})


</script>

<template>
  <div class="w-full px-[10%]">
    <div 
      :class="screenWidth <= 500? 'text-center px-[10%]' : 'text-center'"
    >
      <h1 class="text-[36px] font-[600] leading-10 mb-[20px] tracking-tight">
        Why Stake With Casimir?
      </h1>
    </div>
    <div class="flex items-start justify-center gap-[5px]">
      <button
        v-for="i in 4"
        :key="i"
        class="w-full h-[10px] bg-grey_1 rounded-[3px] overflow-hidden"
        style="box-shadow: 0px 1px 2px 0px rgba(16, 24, 40, 0.05);"
        @click="tabShowing = i"
      >
        <div :class="i === tabShowing? 'bg-primary/[0.75] expand h-full w-full' : 'w-[0px]'" />
      </button>
    </div>
    <div class="mt-[60px] h-[300px]">
      <div
        v-if="tabShowing === 1"
        class="text-center"
      >
        <span class="text-[12px] font-[600] text-primary">New </span>
        <h1 class="text-[28px] font-[500] leading-10 mb-[10px] tracking-tight text-grey_3">
          Decentralized 
          Self Staking
        </h1>
        <div class="flex items-center justify-center">
          <p class="text-[14px] font-[400] text-grey_4 w-full max-w-[650px] tracking-wide">
            Consensus Networks, a provider of blockchain infrastructure, nodes, and staking services, is
            introducing Casimir SelfStake, a non-custodial Ethereum (ETH) staking platform driven by account
            abstraction and distributed validator technology. Our primary objective is to establish a
            permissionless solution for staking and digital asset management that upholds the core principles
            of the Ethereum Protocol and the wider Web3.0 ecosystem.
          </p>
        </div>
      </div>

      <div
        v-else-if="tabShowing === 2"
        class="text-center"
      >
        <span class="text-[12px] font-[600] text-primary">Future </span>
        <h1 class="text-[28px] font-[600] leading-10 mb-[10px] tracking-tight text-grey_3">
          Beyond Staking
        </h1>

        <div class="flex items-center justify-center">
          <p class="text-[14px] font-[400] text-grey_4 max-w-[650px] tracking-wide">
            With Casimir's native integration at Layer 1, users
            can easily engage with NFTs or DeFi protocols, whether it's creating, trading, or managing
            these digital assets. By eliminating the need for additional bridges or intermediaries,
            Casimir enables a more direct and efficient interaction with the NFT and DeFi space. For
            emerging use cases, such as Eigenlayer, Casimir's integration at Layer 1 would enable users
            to take advantage of the Eigenlayer rehypothecating functionality in a more native manner
            compared to other solutions.
          </p>
        </div>
      </div>
      <div
        v-else-if="tabShowing === 3"
        class="text-center"
      >
        <span class="text-[12px] font-[600] text-primary">Assurance </span>
        <h1 class="text-[28px] font-[600] leading-10 mb-[10px] tracking-tight text-grey_3">
          EigenLayer
        </h1>

        <div class="flex items-center justify-center">
          <p class="text-[14px] font-[400] text-grey_4 w-full max-w-[650px] tracking-wide">
            Casimir's permissionless smart contracts, distributed key generation, and decentralized 
            oracles create a trust-minimized environment to reduce counter-party risk and other 
            centralized points of failure. This allows users to create safe, non-custodial 
            interactions not only with staking but other DeFi tools across Web3.
          </p>
        </div>
      </div>
      <div
        v-else-if="tabShowing === 4"
        class="text-center"
      >
        <span class="text-[12px] font-[600] text-primary">Assurance </span>
        <h1 class="text-[28px] font-[600] leading-10 mb-[10px] tracking-tight text-grey_3">
          EigenPod
        </h1>

        <div class="flex items-center justify-center">
          <p class="text-[14px] font-[400] text-grey_4 w-full max-w-[650px] tracking-wide">
            As we grow, users will be able to use Casimir to access a variety of use cases beyond staking. 
            Shortly after launch, we will enable restaking on EigenLayer through the creation of non-custodial 
            EigenPods. This allows users to utilize EigenLayer's rehypothecation without worrying about the cap limits of LSTs
          </p>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.expand {
  transition: width 5.5s ease; 
}
</style>@/composables/screenDimensions