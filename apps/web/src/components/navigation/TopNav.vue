<script lang="ts" setup>
import { ref, watch } from 'vue'
import MultiwalletConnect from './components/MultiwalletConnect.vue'
import StakingProtocols from './components/StakingProtocols.vue'
import useUsers from '@/composables/users'

const { user } = useUsers()

// To Do: connect this to our Auth and see if an account exsists
const account = ref(user.value? user.value.address? true: false : false)

watch(user, ()=> {
  account.value = user.value? user.value.address? true: false : false
})
</script>

<template>
  <div 
    class="w-full bg-white border-b border-b-grey_2 h-70 flex
    justify-center items-center"
  >
    <div 
      class="max-w-[1280px] min-w-[380px] w-full flex
      justify-between items-center px-25"
    >
      <div>
        <RouterLink 
          :to="user? '/user-dashboard:' + user.address:'/'"
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
          hover:border-b hover:border-b-primary  mt-1"
          :class="!account? 'text-grey_5 cursor-default': ''"
        >
          <router-link 
            to="/"
            class="h-70 flex gap-15 items-center"
          >
            <i class="iconoir-wallet" />
            <h6 class="sr-only s_md:not-sr-only">
              Multi-Wallet
            </h6>
          </router-link>
          
          <div class="nav_modal flex justify-center">
            <div class="max-w-[1280px] min-w-[380px] w-full text-center">
              <h6 class="text-grey_5 font-medium mb-25">
                Connect wallets and view a breakdown of the wallets you have connected 
              </h6>
            </div>
          </div>
        </div>
        <div
          class="flex gap-15 items-center nav_modal_container 
          px-50 lg:px-40 md:px-30 sm:px-20 h-full
          hover:border-b hover:border-b-primary mt-1"
        >
          <router-link 
            :to="user? '/user-dashboard:' + user.address :''"
            class="h-70 flex gap-15 items-center"
            :class="user? '' : 'opacity-[0.25] cursor-default'"
          >
            <i
              class="iconoir-report-columns"
            />
            <h6 class="sr-only s_md:not-sr-only">
              Dashboard
            </h6>
          </router-link>
          
          <div
            v-show="user"
            class="nav_modal flex justify-center"
          >
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
            :to="user? '/stake':''"
            class="h-70 flex gap-15 items-center"
            :class="user? '' : 'opacity-[0.25] cursor-default'"
          >
            <img
              src="/staking-icon-black.svg"
              alt="Staking Icon"
              class="h-16"
              :class="!account? 'opacity-50': 'opacity-100'"
            >
            <h6 class="sr-only s_md:not-sr-only">
              Staking
            </h6>
          </router-link>
          
          <div 
            v-show="user"
            class="nav_modal flex justify-center"
          >
            <div class="max-w-[1280px] min-w-[380px] w-full text-center">
              <h6 class="text-grey_5 font-medium mb-25">
                Stake to any of our supported protocols 
              </h6>
              <StakingProtocols />
            </div>
          </div>
        </div>
        <!-- For future Versions -->
        <!-- <div
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
        </div> -->
      </div>
      <div />
      <!-- <div class="h-70 flex gap-50 items-center">
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
          <div 
            class="nav_modal flex justify-center"
            style="
            height: calc(100vh - 200px);
            max-height: 500px;
            min-height: 200px;
            "
          >
            <div class="max-w-[1280px] min-w-[380px] w-full h-full text-center pb-25">
              <h6 class="text-grey_5 font-medium h-50">
                Connect your wallets to view and access all of your assets in one location
              </h6>
              <MultiwalletConnect />
            </div>
          </div>
        </div>
      </div> -->
    </div>
  </div>
</template>