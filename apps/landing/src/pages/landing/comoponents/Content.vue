<script lang="ts" setup>
import useScreenDimentions from '@/composables/screenDimenstions'

const { screenWidth } = useScreenDimentions()
</script>

<template>
  <div class="w-full">
    <div class="flex items-center justify-center flex-wrap-reverse gap-[100px]">
      <div>
        <div
          class="text-left"
          :class="screenWidth <= 500? 'text-center px-[10%]' : 'text-left'"
        >
          <span class="text-[14px] font-[600] text-primary">New</span>
          <h1 class="text-[36px] font-[600] leading-10 mb-[10px]">
            Decentralized <br>
            Self Staking
          </h1>
          <p class="text-[16px] font-[400] text-grey_4 w-[400px] max-w-full">
            Consensus Networks, a provider of blockchain infrastructure, nodes, and staking services, is
            introducing Casimir SelfStake, a non-custodial Ethereum (ETH) staking platform driven by account
            abstraction and distributed validator technology. Our primary objective is to establish a
            permissionless solution for staking and digital asset management that upholds the core principles
            of the Ethereum Protocol and the wider Web3.0 ecosystem.
          </p>
        </div>
      </div>
      <div class="max-w-full w-[500px]">
        <img
          src="/decentralized_nodes.svg"
          alt="Decentralized node image"
        >
      </div>
    </div>
    <div class="flex items-center justify-center flex-wrap gap-[100px] mt-[100px]">
      <div class="max-w-full w-[500px]">
        <img
          src="/future_casimir.svg"
          alt="future casimir image"
        >
      </div>
      <div>
        <div 
          :class="screenWidth <= 500? 'text-center px-[10%]' : 'text-left'"
        >
          <span class="text-[14px] font-[600] text-primary">Future</span>
          <h1 class="text-[36px] font-[600] leading-10 mb-[10px]">
            Beyond Staking
          </h1>
          <p class="text-[16px] font-[400] text-grey_4 w-[400px] max-w-full">
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
    </div>
    <div class="flex items-center justify-center flex-wrap border-y py-[50px] my-[100px]">
      <div class="w-full flex items-center justify-center">
        <img
          src="/minimal_trust.svg"
          alt="handshake image"
          class="h-[40px]"
        >
      </div>
      <div class="w-full text-center mb-[20px]">
        <h1 class="text-[36px] font-[600] leading-10">
          Minimal Trust
        </h1>
      </div>
      
      <div>
        <p class="text-[16px] font-[400] text-grey_4 px-[10%]">
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
  </div>
</template>


<style scoped>
</style>