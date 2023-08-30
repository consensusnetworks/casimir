<script lang="ts" setup>
import VueFeather from 'vue-feather'
import useScreenDimensions from '@/composables/screenDimensions'

const { screenWidth } = useScreenDimensions()

</script>

<template>
  <div
    class="my-[60px]"
    :class="screenWidth <= 1150? 'px-[5%]' : screenWidth <= 1050? 'px-[0]' :'px-[10%]'"
  >
    <div class="text-center my-[60px]">
      <span class="text-[14px] font-[600] text-primary">Features</span>
      <h1 class="text-[36px] font-[600] mt-[20px] tracking-tight">
        Take Control of Your Stakings
      </h1>
      <p class="text-[16px] font-[400] text-grey_4 tracking-tight">
        Our secure platform ensures you control your digital assets
      </p>
    </div>
    <div class="flex items-start justify-around gap-[100px] flex-wrap">
      <div class="text-center max-w-[350px]">
        <div class="w-full flex justify-center">
          <div
            class="w-[40px] h-[40px] flex items-center justify-center rounded-[8px] border mb-[20px] text-grey_5"
            style="box-shadow: 0px 1px 2px 0px rgba(16, 24, 40, 0.05);"
          >
            <vue-feather
              type="cpu"
              class="w-[20px] h-[20px] text-grey_5"
            />
          </div>
        </div>
        
        <h6 class="text-[24px] font-[600] mb-[10px]">
          Decentralized Staking
        </h6>

        <p class="text-[12px] font-[400] text-grey_5">
          Casimir SelfStake a non-custodial Ethereum (ETH) staking platform driven by account abstraction and distributed validator technology. Casimir is a  permissionless solution for staking and digital asset management that upholds the core principles of the Ethereum Protocol and the wider Web3.0 ecosystem.
        </p>
      </div>
      <div class="text-center max-w-[350px]">
        <div class="w-full flex justify-center">
          <div
            class="w-[40px] h-[40px] flex items-center justify-center rounded-[8px] border mb-[20px]" 
            style="box-shadow: 0px 1px 2px 0px rgba(16, 24, 40, 0.05);"
          >
            <vue-feather
              type="database"
              class="w-[20px] h-[20px] text-grey_5"
            />
          </div>
        </div>
        
        <h6 class="text-[24px] font-[600] mb-[10px]">
          L2 Integrations
        </h6>

        <p class="text-[12px] font-[400] text-grey_5">
          Because our staking technology plugs you in directly to a validator set, we can natively allow you to access emerging use cases such as Eigenlayer. Shortly after mainnet launch, we’ll enable Eigenpod creation that will allow any of our stakers to opt into Eigenlayer, without worrying about the LST caps.
        </p>
      </div>
      <div class="text-center max-w-[350px]">
        <div class="w-full flex justify-center">
          <div
            class="w-[40px] h-[40px] flex items-center justify-center rounded-[8px] border mb-[20px] text-[10px] text-grey_5" 
            style="box-shadow: 0px 1px 2px 0px rgba(16, 24, 40, 0.05);"
          >
            <!-- <vue-feather
              type="box"
              class="w-[20px] h-[20px] text-grey_5"
            /> -->
            0..32
          </div>
        </div>
        
        <h6 class="text-[24px] font-[600] mb-[10px]">
          No Minimum
        </h6>

        <p class="text-[12px] font-[400] text-grey_5">
          Unlike other ETH staking protocols that required you to use an Liquid Stake Token (LST), Casimir creates a staking primitive that allows users to trustlessly stake any amount of ETH to a high performing validator set.
        </p>
      </div>
      <div class="text-center max-w-[350px]">
        <div class="w-full flex justify-center">
          <div
            class="w-[40px] h-[40px] flex items-center justify-center rounded-[8px] border mb-[20px]" 
            style="box-shadow: 0px 1px 2px 0px rgba(16, 24, 40, 0.05);"
          >
            <vue-feather
              type="shield"
              class="w-[20px] h-[20px] text-grey_5"
            />
          </div>
        </div>
        
        <h6 class="text-[24px] font-[600] mb-[10px]">
          Slashing Protection
        </h6>

        <p class="text-[12px] font-[400] text-grey_5">
          Our use of Distributed Validator Technology (DVT) enables a reliable and robust validator set that minimizes slashing risk and maximizes rewards in L1 ETH.
        </p>
      </div>
    </div>
  </div>
</template>


<style scoped></style>@/composables/screenDimensions