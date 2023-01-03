<script lang="ts" setup>
import { ref } from 'vue'
import MultiwalletConnect from './components/MultiwalletConnect.vue'
import StakingProtocols from './components/StakingProtocols.vue'

// To Do: connect this to our Auth and see if an account exsists
const account = ref(true)
</script>

<template>
  <div 
    class="w-full border-b border-b-grey_2 h-70 flex
    justify-center items-center"
  >
    <div 
      class="max-w-[1280px] min-w-[380px] w-full flex
      justify-between items-center px-25"
    >
      <div>
        <RouterLink 
          to="/"
        >
          <img
            src="/casimir.svg"
            alt="Casimir Logo"
            class="h-20"
          >
        </RouterLink>
      </div>
      <div
        class="h-70 flex gap-50 items-center lg:gap-40
        md:gap-30 sm:gap-20
        "
      >
        <div
          class="flex gap-15 items-center nav_modal_container 
          px-50 lg:px-40 md:px-30 sm:px-20 h-full
          hover:border-b hover:border-b-primary mt-1"
        >
          <router-link 
            to="/"
            class="h-70 flex gap-15 items-center"
          >
            <i
              class="iconoir-report-columns"
            />
            <h6 class="sr-only s_md:not-sr-only">
              Dashboard
            </h6>
          </router-link>
          
          <div class="nav_modal flex justify-center">
            <div class="max-w-[1280px] min-w-[380px] pb-20 w-full text-center">
              <h6 class="text-grey_5 font-medium">
                View your data across all of  your connected wallets
              </h6>
            </div>
          </div>
        </div>
        <div
          class="flex gap-15 items-center nav_modal_container 
          px-50 lg:px-40 md:px-30 sm:px-20 h-full
          hover:border-b hover:border-b-primary  mt-1"
          :class="!account? 'text-grey_5 cursor-default': ''"
        >
          <router-link 
            to="/stake"
            class="h-70 flex gap-15 items-center"
          >
            <img
              src="staking-icon-black.svg"
              alt="Staking Icon"
              class="h-16"
              :class="!account? 'opacity-50': 'opacity-100'"
            >
            <h6 class="sr-only s_md:not-sr-only">
              Staking
            </h6>
          </router-link>
          
          <div class="nav_modal flex justify-center">
            <div class="max-w-[1280px] min-w-[380px] w-full text-center">
              <h6 class="text-grey_5 font-medium mb-25">
                Stake to any of our supported protocols 
              </h6>
              <StakingProtocols />
            </div>
          </div>
        </div>
        <div
          class="flex gap-15 items-center nav_modal_container 
          px-50 lg:px-40 md:px-30 sm:px-20 h-full
          hover:border-b hover:border-b-primary  mt-1"
          :class="!account? 'text-grey_5 cursor-default': ''"
        >
          <div
            class="h-70 flex gap-15 items-center"
          >
            <i
              class="iconoir-database-star"
            />
            <h6 class="sr-only s_md:not-sr-only">
              Assets
            </h6>
          </div>
          
          <div class="nav_modal flex justify-center">
            <div class="max-w-[1280px] min-w-[380px] w-full text-center">
              <h6 class="text-grey_5 font-medium">
                View your data across all of  your connected wallets
              </h6>
              <div class="flex gap-70 justify-center items-center mt-25">
                <!-- to="/assets/crypto" -->
                <router-link 
                  to="/assets"
                  class="flex gap-15 items-center pb-20 staking_nav_item"
                >
                  <i
                    class="iconoir-coin text-[25px]"
                  />
                  <h6 class="font-bold">
                    Crypto
                  </h6>
                  <div class="staking_nav_item_bar" />
                </router-link>
                <!-- to="/assets/nfts" -->
                <router-link 
                  to="/assets"
                  class="flex gap-15 items-center pb-20 staking_nav_item"
                >
                  <i
                    class="iconoir-media-image text-[25px]"
                  />
                  <h6 class="font-bold">
                    NFTs
                  </h6>
                  <div class="staking_nav_item_bar" />
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="h-70 flex gap-50 items-center">
        <div
          class="flex gap-15 items-center nav_modal_container 
          px-50 lg:px-40 md:px-30 sm:px-20
          hover:border-x hover:border-x-grey_2 h-full
          hover:border-b hover:border-b-white mt-1"
        >
          <div 
            class="h-70 flex gap-15 items-center"
          >
            <h6 class="sr-only s_md:not-sr-only">
              Multi-Wallet
            </h6>
            <i
              class="iconoir-wallet"
            />
          </div>
          <div class="nav_modal flex justify-center">
            <div class="max-w-[1280px] min-w-[380px] w-full text-center">
              <MultiwalletConnect />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>